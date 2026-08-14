create table if not exists nexus_control_plane.route_observations (
  id bigserial primary key,
  capability text,
  route text not null,
  method text not null,
  source text not null check (source in ('boundary','compatibility','nexus')),
  response_status integer,
  ok boolean not null,
  observed_at timestamptz not null default now()
);

create index if not exists route_observations_capability_observed_idx
  on nexus_control_plane.route_observations (capability, observed_at desc);

create index if not exists route_observations_route_observed_idx
  on nexus_control_plane.route_observations (route, method, observed_at desc);

alter table nexus_control_plane.route_observations enable row level security;

revoke all on table nexus_control_plane.route_observations from public;
revoke all on table nexus_control_plane.route_observations from anon;
revoke all on table nexus_control_plane.route_observations from authenticated;
grant select, insert, delete on table nexus_control_plane.route_observations to service_role;

comment on table nexus_control_plane.route_observations is
  'Nexus routing evidence metadata only. Never stores request queries, payloads, message bodies or user content.';

create or replace function public.nexus_user_record_route_observation(
  p_capability text,
  p_route text,
  p_method text,
  p_source text,
  p_response_status integer,
  p_ok boolean
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
  if p_route is null or left(p_route, 5) <> '/api/' then
    raise exception 'invalid_route';
  end if;
  if upper(coalesce(p_method,'')) not in ('GET','POST','PATCH','DELETE','PUT') then
    raise exception 'invalid_method';
  end if;
  if p_source not in ('boundary','compatibility','nexus') then
    raise exception 'invalid_source';
  end if;

  insert into nexus_control_plane.route_observations (
    capability, route, method, source, response_status, ok
  ) values (
    nullif(left(coalesce(p_capability,''), 160), ''),
    left(p_route, 240),
    upper(p_method),
    p_source,
    p_response_status,
    coalesce(p_ok,false)
  );
  return true;
end;
$$;

create or replace function public.nexus_route_observation_summary(
  p_since timestamptz default (now() - interval '7 days')
)
returns table (
  capability text,
  route text,
  method text,
  source text,
  calls bigint,
  successful_calls bigint,
  last_observed_at timestamptz
)
language sql
security definer
set search_path = nexus_control_plane, public, pg_temp
as $$
  select capability, route, method, source,
         count(*)::bigint,
         count(*) filter (where ok)::bigint,
         max(observed_at)
  from nexus_control_plane.route_observations
  where observed_at >= coalesce(p_since, now() - interval '7 days')
  group by capability, route, method, source
  order by max(observed_at) desc;
$$;

revoke all on function public.nexus_user_record_route_observation(text,text,text,text,integer,boolean) from public;
revoke all on function public.nexus_user_record_route_observation(text,text,text,text,integer,boolean) from anon;
grant execute on function public.nexus_user_record_route_observation(text,text,text,text,integer,boolean) to authenticated;

revoke all on function public.nexus_route_observation_summary(timestamptz) from public;
revoke all on function public.nexus_route_observation_summary(timestamptz) from anon;
revoke all on function public.nexus_route_observation_summary(timestamptz) from authenticated;
grant execute on function public.nexus_route_observation_summary(timestamptz) to service_role;
