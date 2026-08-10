# CRM Independent Storage

Nexus CRM now has an isolated storage boundary. Legacy systems remain read-only.

## Read modes

- `legacy` — default and safest mode. Reads Navigator through the existing adapter.
- `shadow` — serves legacy data and compares against Nexus storage when a matching record exists.
- `nexus` — serves Nexus storage only. Must not be enabled for production cutover until migration gates and durable storage are green.

## Persistence

`NEXUS_CRM_STORE_URL` and `NEXUS_CRM_STORE_TOKEN` enable a PostgREST/Supabase-compatible durable store using `crm_records`.
Without them the adapter falls back to process memory for development only.

## Safety rules

1. No write-back to Navigator or any original application.
2. No automatic production cutover.
3. Durable storage is required before production Nexus mode.
4. Shadow evidence and caller migration remain mandatory.
5. Every record preserves `legacy_id` when available for rollback and comparison.
