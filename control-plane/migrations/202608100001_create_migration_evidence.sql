create table if not exists public.migration_evidence (
  capability text not null,
  kind text not null,
  accepted boolean not null default false,
  source text,
  basis text,
  sample_size integer not null default 0,
  observed_at timestamptz not null default now(),
  metadata jsonb,
  primary key (capability, kind)
);

alter table public.migration_evidence enable row level security;

comment on table public.migration_evidence is 'Nexus control-plane migration evidence only. No business/source payloads.';
