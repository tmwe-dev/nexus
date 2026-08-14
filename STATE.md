# TMWE Nexus — Current State

This file is the durable handoff for autonomous continuation between sessions.

Authoritative rules: `RULES.md`.

## Active objective

Build TMWE Nexus to completion while keeping legacy/original systems read-only, copying/porting required logic into the new TMWE/Nexus infrastructure, simplifying the operator experience, preserving working business behavior, and removing temporary coupling only after migration gates pass.

## Repository / deployment

- Repository: `tmwe-dev/nexus`
- Working branch: `agent/control-plane-canonical-router`
- Draft PR: `#51`
- Production branch: `main`
- Production domain: `tmwe-nexus.vercel.app`
- Working branch auto-deploys through GitHub → Vercel Preview.
- Multiple commits in this session received Vercel `success` status.
- Preview visual access is still blocked for the current Vercel connector identity; this is an access limitation, not a build failure.
- Do not merge the complete working branch into `main` merely to inspect UI work.

## Rules persisted

`RULES.md` is authoritative and includes:

- original/legacy systems are read-only unless the owner explicitly orders a change to that original;
- required legacy code/logic is copied, ported, adapted or reimplemented in Nexus/new infrastructure;
- autonomous continuation remains active until the requested objective is complete;
- future sessions resume from durable state without asking permission to continue;
- one owner/source of truth per capability/datum;
- no private cross-service database reading as final architecture;
- graceful degradation, idempotency and migration gates;
- complexity belongs in the backend, not in the normal operator UI;
- production changes remain deliberate and reversible.

## UI simplification completed

### Home — `public/index.html`

- business-first `Cosa vuoi fare?` experience;
- direct entries: Mail, CRM, Aziende;
- Navigator, Cobra and BarTalk shown only as future/preparing modules;
- System Map/technical diagnostics secondary under administration.

### Mail — `public/funnemail.html`

- technical capability/runtime terminology removed from normal workflow;
- primary navigation: Scrivi, Inbox, Bozze;
- secondary functions under `Altro`: Mittenti, Task, Regole, Sincronizza;
- search, read, status actions, task creation, classification, AI compose, draft handling, sender intelligence, rules, sync and enrichment preserved;
- browser creates a fresh `Idempotency-Key` for intentional Send, Draft Create and Sync;
- authentication-refresh retry preserves the same request options and idempotency key.

### CRM — `public/crm.html`

- technical health/storage/read-mode diagnostics removed;
- primary tabs: Contatti, Aziende, Opportunità;
- search, contact detail and pipeline behavior preserved.

### Contact — `public/contact.html`

- raw normalized payload/provenance removed from operator view;
- useful profile fields, email/phone actions and recent activities retained.

### Companies — `public/companies.html`

- simple Aziende search;
- registry/infrastructure terminology removed.

## Funnemail source immutability

- Original/source repository: `tmwe-dev/funnemail`.
- Treat the original repository/application as read-only.
- Canonical Nexus-owned integration source: `services/funnemail-boundary/index.ts`.
- Deployment notes: `services/funnemail-boundary/README.md`.
- Historical Funnemail branch/PR is not the place for future Nexus integration changes.

## Funnemail boundary deployment

- Supabase project: `rxocvyfhsqduowltmfbp` (`funnemail`).
- Edge Function: `funnemail-nexus-v1`.
- Function ID: `c21744fb-f6d1-44bf-9c3f-2ecd9daf6bf5`.
- Current deployed version: **6**.
- Status: **ACTIVE**.
- `verify_jwt=false` is intentional because the boundary performs explicit authentication itself.
- Data operations validate and delegate the Funnemail user JWT and preserve user-scoped RLS.
- No service-role mailbox key is exposed to browser/Nexus UI.

Current boundary contracts include:

- auth login / refresh / current user;
- message search / read;
- dashboard;
- message status;
- draft list / create / safe actions;
- send;
- sync;
- classify;
- tasks list/create;
- senders;
- rules;
- compose;
- sender intelligence / enrichment.

## Funnemail target configuration

`registry/connections.js` now defines the public non-secret Funnemail boundary URL as `targetDefaultBase`:

`https://rxocvyfhsqduowltmfbp.supabase.co/functions/v1/funnemail-nexus-v1`

`FUNNEMAIL_BASE_URL` remains an optional environment override.

Therefore normal Mail routing no longer depends on invisible/missing Vercel environment configuration for the target URL.

The old `NEXUS_FUNNEMAIL_SUPABASE_URL`, `NEXUS_FUNNEMAIL_ANON_KEY` and related settings are rollback-only compatibility configuration.

## Operator routing status

Detailed inventory: `docs/OPERATOR_ROUTE_MAP.md`.

### Boundary-preferred visible Mail flows

- login / refresh / current user;
- inbox search;
- message read;
- dashboard counters;
- read/unread/archive/trash/flag;
- draft list;
- draft create;
- approve/discard draft;
- compose/send;
- sync;
- classify;
- task list/create;
- senders;
- rules;
- AI writing assistance;
- enrichment/sender intelligence.

### Remaining visible compatibility route

- `POST /api/email/reclassify` still prefers the existing `funnemail-reclassify-now` / `funnemail-reclassify-batch` path through the compatibility adapter.

This is intentionally retained until it can be proxied without changing exact semantics and conformance is proved.

### Residual compatibility outside the primary simplified UI

- task PATCH/DELETE;
- draft-action `send` (distinct from normal compose/send), retained until dedicated idempotency is in place;
- diagnostics/self-test paths;
- legacy fallbacks retained explicitly for rollback until migration gates pass.

Do not delete fallback code simply because boundary-preferred routing exists.

## Resilience

`modules/funnemail/serviceClient.js` now uses `modules/resilience/circuitBreaker.js`:

- failure threshold: 3 consecutive failures;
- open/reset interval: 30 seconds;
- half-open retry after reset interval;
- boundary timeout default: 12 seconds (`FUNNEMAIL_BOUNDARY_TIMEOUT_MS`);
- runtime boundary failure does not silently fall through to direct legacy DB access.

This makes graceful degradation explicit rather than cascading requests into the source system.

## Registry

`registry/capabilities.js` now includes the Mail capabilities exposed by the boundary, including message/dashboard/draft/send/sync/classify/tasks/senders/rules/compose/enrich contracts.

They intentionally remain migration/compatibility-status entries until conformance and deprecation gates pass. Preferred routing is not permission to remove legacy behavior.

## CRM state

- Operator UI is simplified.
- CRM contact search still uses the Navigator read adapter + identity resolver.
- Contact read has routing/shadow capability for a future independent Nexus store.
- Original Navigator data remains source of truth until migration gates authorize cutover.
- Do not modify Navigator original files during this migration.

## Dedicated Nexus Control Plane — genuine blocker

Supabase project inventory was rechecked during this session.

There is **no project clearly identifiable as a dedicated Nexus/Control Plane database**.

Do not repurpose Funnemail, CRM, WCA or another unrelated Supabase project just because it exists; that would create the coupling the architecture forbids.

Remaining blocker:

1. choose/create a dedicated Nexus Control Plane Supabase project;
2. creation requires explicit organization/cost confirmation under the Supabase tooling rules;
3. apply `control-plane/migrations/202608130001_create_idempotency_ledger.sql` there;
4. configure `NEXUS_CONTROL_PLANE_URL` and `NEXUS_CONTROL_PLANE_KEY` securely;
5. verify durable claims/replays;
6. only then move `NEXUS_IDEMPOTENCY_MODE` from audit to enforce.

Until then, idempotency must remain audit/fail-safe compatible.

## Remaining technical debt

1. Migrate/prove `email.reclassify.v1` without semantic drift.
2. Establish the dedicated Nexus Control Plane and durable idempotency ledger.
3. Add conformance/shadow evidence for every boundary-migrated Funnemail contract before removing any fallback.
4. Finish resilience wiring for other cross-service clients, not only Funnemail.
5. Simplify Cobra into an assistant/workflow layer rather than a technical operator application.
6. Continue CRM/Navigator migration with independent ownership boundaries.
7. Agent framework remains incomplete/skeletal.
8. Working branch has a substantial delta from `main`; production release requires deliberate review/release, not an automatic broad merge.

## Next autonomous sequence

On the next invocation, do not ask whether to proceed. Continue in this order unless the owner changes the objective:

1. verify latest branch/Vercel build state;
2. migrate `email.reclassify.v1` as an exact proxy and add conformance evidence;
3. inventory boundary vs compatibility callers and prepare migration-gate scores;
4. once organization/cost confirmation for the dedicated Control Plane is available, create/configure it and apply the idempotency migration;
5. verify durable idempotency and then consider enforce mode;
6. extend circuit breaking/graceful degradation to other canonical cross-service clients;
7. simplify Cobra and its routing;
8. continue app-by-app integration, preserving originals and keeping TMWE2 last unless the owner changes order.

## Production protection

- Original applications/repositories remain untouched.
- Never commit production secrets/service-role keys to GitHub.
- Never expose service-role keys in browser code.
- Do not remove compatibility adapters until migration gates are satisfied.
- Do not broadly merge the working branch into production just to inspect UI changes.
