# Funnemail Application Boundary

Original/source repository: `tmwe-dev/funnemail`.

Canonical Nexus-owned boundary source: `services/funnemail-boundary/`.

`RULES.md` is authoritative. The original Funnemail repository/application is treated as read-only unless the owner explicitly orders a change to that original system.

## Source reviewed

The source application contains:

- inbox and mail reader UI;
- Supabase-backed email message/state storage;
- drafts and tasks;
- mailbox configuration;
- AI classification, prompts, rules, KB and memory;
- dashboards and settings;
- Edge Functions and realtime subscriptions.

Funnemail remains the authoritative source for the existing behavior and mailbox data model. Nexus reads that source to understand behavior and ports/copies the integration logic into Nexus-owned infrastructure.

## Ownership rule

Funnemail remains an independently operable application and remains authoritative for its mailbox data.

Nexus must not make the original application repository its ongoing development workspace. Required integration code is copied, ported, adapted or reimplemented under Nexus/new TMWE infrastructure.

The current boundary implementation source therefore lives under:

`services/funnemail-boundary/`

The function may still be **deployed inside the Funnemail Supabase project** so it executes within the Funnemail security/data boundary and preserves user RLS. Deployment location does not change source-code ownership or authorize modification of the original application repository.

## Current stable capability boundary

The current v1 boundary exposes:

- `email.message.search.v1`
- `email.message.read.v1`
- `email.draft.create.v1`
- `email.send.v1`
- `email.sync.v1`
- `email.classify.v1`

Auth for these user-scoped capabilities uses the delegated Funnemail user JWT. No Nexus service-role key is exposed to the browser and no shared Nexus service secret is required for these six paths.

## Compatibility operations still present

Some operator functions still use temporary Nexus compatibility adapters because they are not yet part of the stable boundary, including parts of:

- message status actions;
- draft listing/actions;
- senders;
- tasks;
- rules;
- enrichment;
- dashboard aggregates;
- Funnemail-specific AI compose/reclassification paths.

These compatibility paths may remain only while their replacement contract/owner is being established. They must not be removed until migration gates pass.

## AI extraction rule

Generic AI platform capabilities must eventually be separated from Funnemail-specific email intelligence. Funnemail-specific behavior remains a domain concern; shared model routing, generic memory, cost tracking and agent infrastructure move to shared services only after callers and data ownership are mapped.

## No big-bang rewrite

Existing Funnemail remains operational while Nexus contracts are introduced around proven functionality.

No original Funnemail code is deleted or refactored as part of Nexus migration. The original remains available for verification and rollback until migration gates are fully satisfied.
