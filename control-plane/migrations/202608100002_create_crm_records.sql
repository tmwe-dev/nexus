create table if not exists public.crm_records (
  entity text not null check (entity in ('contacts','accounts','activities','opportunities')),
  nexus_id text not null,
  legacy_id text,
  source text not null default 'nexus',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (entity, nexus_id)
);

create index if not exists crm_records_legacy_id_idx on public.crm_records (legacy_id);
create index if not exists crm_records_updated_at_idx on public.crm_records (updated_at desc);

comment on table public.crm_records is 'Nexus-owned CRM projection store. Never writes back to legacy source systems.';
