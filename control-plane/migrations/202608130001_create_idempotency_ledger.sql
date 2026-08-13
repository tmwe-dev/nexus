create table if not exists public.idempotency_ledger (
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
  on public.idempotency_ledger (expires_at);

alter table public.idempotency_ledger enable row level security;

comment on table public.idempotency_ledger is
  'Nexus control-plane idempotency metadata only. Never stores business payloads or message bodies.';

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
set search_path = public
as $$
declare
  existing public.idempotency_ledger%rowtype;
  inserted boolean := false;
begin
  insert into public.idempotency_ledger (
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

  get diagnostics inserted = row_count;

  select * into existing
  from public.idempotency_ledger
  where capability = p_capability
    and actor_key = p_actor_key
    and idempotency_key = p_idempotency_key
  for update;

  if inserted then
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

  update public.idempotency_ledger
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

revoke all on function public.nexus_idempotency_claim(text,text,text,text,integer) from public;
revoke all on function public.nexus_idempotency_claim(text,text,text,text,integer) from anon;
revoke all on function public.nexus_idempotency_claim(text,text,text,text,integer) from authenticated;
grant execute on function public.nexus_idempotency_claim(text,text,text,text,integer) to service_role;
