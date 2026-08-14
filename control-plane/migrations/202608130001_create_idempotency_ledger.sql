create schema if not exists nexus_control_plane;

revoke all on schema nexus_control_plane from public;
revoke all on schema nexus_control_plane from anon;
revoke all on schema nexus_control_plane from authenticated;
grant usage on schema nexus_control_plane to service_role;

create table if not exists nexus_control_plane.idempotency_ledger (
  capability text not null,
  actor_key text not null,
  idempotency_key text not null,
  request_hash text not null,
  state text not null default 'pending' check (state in ('pending','completed')),
  result_ref text,
  response_status integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  primary key (capability, actor_key, idempotency_key)
);

create index if not exists idempotency_ledger_expires_at_idx
  on nexus_control_plane.idempotency_ledger (expires_at);

alter table nexus_control_plane.idempotency_ledger enable row level security;

revoke all on table nexus_control_plane.idempotency_ledger from public;
revoke all on table nexus_control_plane.idempotency_ledger from anon;
revoke all on table nexus_control_plane.idempotency_ledger from authenticated;
grant select, insert, update, delete on table nexus_control_plane.idempotency_ledger to service_role;

comment on schema nexus_control_plane is
  'Dedicated TMWE Nexus control-plane storage. Not an operational Funnemail schema.';
comment on table nexus_control_plane.idempotency_ledger is
  'Nexus idempotency metadata only. Never stores business payloads or message bodies.';

create or replace function public.nexus_idempotency_claim(
  p_capability text,
  p_actor_key text,
  p_idempotency_key text,
  p_request_hash text,
  p_ttl_seconds integer default 86400
)
returns table (
  decision text,
  current_state text,
  current_result_ref text,
  current_response_status integer,
  current_request_hash text
)
language plpgsql
security definer
set search_path = nexus_control_plane, public, pg_temp
as $$
declare
  existing nexus_control_plane.idempotency_ledger%rowtype;
  affected_rows integer := 0;
begin
  insert into nexus_control_plane.idempotency_ledger (
    capability, actor_key, idempotency_key, request_hash, state, expires_at
  ) values (
    p_capability,
    p_actor_key,
    p_idempotency_key,
    p_request_hash,
    'pending',
    now() + make_interval(secs => greatest(60, least(coalesce(p_ttl_seconds, 86400), 604800)))
  )
  on conflict (capability, actor_key, idempotency_key) do nothing;

  get diagnostics affected_rows = row_count;

  select * into existing
  from nexus_control_plane.idempotency_ledger
  where capability = p_capability
    and actor_key = p_actor_key
    and idempotency_key = p_idempotency_key
  for update;

  if affected_rows = 1 then
    return query select 'execute', existing.state, existing.result_ref, existing.response_status, existing.request_hash;
    return;
  end if;

  if existing.request_hash <> p_request_hash then
    return query select 'conflict', existing.state, existing.result_ref, existing.response_status, existing.request_hash;
    return;
  end if;

  if existing.state = 'completed' and existing.expires_at > now() then
    return query select 'replay', existing.state, existing.result_ref, existing.response_status, existing.request_hash;
    return;
  end if;

  if existing.state = 'pending' and existing.expires_at > now() then
    return query select 'in_progress', existing.state, existing.result_ref, existing.response_status, existing.request_hash;
    return;
  end if;

  update nexus_control_plane.idempotency_ledger
  set state = 'pending',
      request_hash = p_request_hash,
      result_ref = null,
      response_status = null,
      updated_at = now(),
      expires_at = now() + make_interval(secs => greatest(60, least(coalesce(p_ttl_seconds, 86400), 604800)))
  where capability = p_capability
    and actor_key = p_actor_key
    and idempotency_key = p_idempotency_key
  returning * into existing;

  return query select 'execute', existing.state, existing.result_ref, existing.response_status, existing.request_hash;
end;
$$;

create or replace function public.nexus_idempotency_complete(
  p_capability text,
  p_actor_key text,
  p_idempotency_key text,
  p_request_hash text,
  p_result_ref text default null,
  p_response_status integer default 200
)
returns boolean
language plpgsql
security definer
set search_path = nexus_control_plane, public, pg_temp
as $$
declare
  affected_rows integer := 0;
begin
  update nexus_control_plane.idempotency_ledger
  set state = 'completed',
      result_ref = nullif(left(coalesce(p_result_ref,''), 500), ''),
      response_status = p_response_status,
      updated_at = now()
  where capability = p_capability
    and actor_key = p_actor_key
    and idempotency_key = p_idempotency_key
    and request_hash = p_request_hash
    and state = 'pending';

  get diagnostics affected_rows = row_count;
  return affected_rows = 1;
end;
$$;

create or replace function public.nexus_idempotency_probe()
returns table (ledger_rows bigint, pending_rows bigint, completed_rows bigint)
language sql
security definer
set search_path = nexus_control_plane, public, pg_temp
as $$
  select
    count(*)::bigint,
    count(*) filter (where state = 'pending')::bigint,
    count(*) filter (where state = 'completed')::bigint
  from nexus_control_plane.idempotency_ledger
  where expires_at > now();
$$;

create or replace function public.nexus_user_idempotency_claim(
  p_capability text,
  p_idempotency_key text,
  p_request_hash text,
  p_ttl_seconds integer default 86400
)
returns table (
  decision text,
  current_state text,
  current_result_ref text,
  current_response_status integer,
  current_request_hash text
)
language plpgsql
security definer
set search_path = nexus_control_plane, public, pg_temp
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;
  return query
  select * from public.nexus_idempotency_claim(
    p_capability,
    'user:' || uid::text,
    p_idempotency_key,
    p_request_hash,
    p_ttl_seconds
  );
end;
$$;

create or replace function public.nexus_user_idempotency_complete(
  p_capability text,
  p_idempotency_key text,
  p_request_hash text,
  p_result_ref text default null,
  p_response_status integer default 200
)
returns boolean
language plpgsql
security definer
set search_path = nexus_control_plane, public, pg_temp
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;
  return public.nexus_idempotency_complete(
    p_capability,
    'user:' || uid::text,
    p_idempotency_key,
    p_request_hash,
    p_result_ref,
    p_response_status
  );
end;
$$;

revoke all on function public.nexus_idempotency_claim(text,text,text,text,integer) from public;
revoke all on function public.nexus_idempotency_claim(text,text,text,text,integer) from anon;
revoke all on function public.nexus_idempotency_claim(text,text,text,text,integer) from authenticated;
grant execute on function public.nexus_idempotency_claim(text,text,text,text,integer) to service_role;

revoke all on function public.nexus_idempotency_complete(text,text,text,text,text,integer) from public;
revoke all on function public.nexus_idempotency_complete(text,text,text,text,text,integer) from anon;
revoke all on function public.nexus_idempotency_complete(text,text,text,text,text,integer) from authenticated;
grant execute on function public.nexus_idempotency_complete(text,text,text,text,text,integer) to service_role;

revoke all on function public.nexus_idempotency_probe() from public;
revoke all on function public.nexus_idempotency_probe() from anon;
revoke all on function public.nexus_idempotency_probe() from authenticated;
grant execute on function public.nexus_idempotency_probe() to service_role;

revoke all on function public.nexus_user_idempotency_claim(text,text,text,integer) from public;
revoke all on function public.nexus_user_idempotency_claim(text,text,text,integer) from anon;
grant execute on function public.nexus_user_idempotency_claim(text,text,text,integer) to authenticated;

revoke all on function public.nexus_user_idempotency_complete(text,text,text,text,integer) from public;
revoke all on function public.nexus_user_idempotency_complete(text,text,text,text,integer) from anon;
grant execute on function public.nexus_user_idempotency_complete(text,text,text,text,integer) to authenticated;
