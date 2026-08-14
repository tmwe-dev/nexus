# TMWE Nexus — Current State

This file is the durable handoff for autonomous continuation between sessions.

Authoritative rules: `RULES.md`.

## Repository / deployment

- Repository: `tmwe-dev/nexus`
- Working branch: `agent/control-plane-canonical-router`
- Draft PR: `#51`
- Production branch: `main`
- Production domain: `tmwe-nexus.vercel.app`
- Original/source repositories remain read-only.
- Do not merge the working branch merely to inspect UI work.

## Current phase result

The **Funnemail routing/extraction phase is complete at code level** and the **Nexus durable idempotency store is active** inside the existing Funnemail Supabase project, isolated in the dedicated `nexus_control_plane` schema.

No new Supabase project was created and no additional project cost was incurred.

Normal Mail retry-sensitive user mutations are configured for **durable enforce mode**. Service-to-service idempotency remains **audit mode** until Cobra/other service workflows receive a server-only Control Plane credential.

Legacy deletion / production cutover is still blocked by authenticated conformance, active-caller evidence and controlled side-effect evidence. Those gates remain intentionally conservative.

## UI simplification completed

### Home

Business-first entry points: Mail, CRM, Aziende. Technical diagnostics stay under Administration.

### Mail

Primary navigation: Scrivi, Inbox, Bozze. Secondary functions: Mittenti, Task, Regole, Sincronizza.

The browser generates an `Idempotency-Key` for intentional Send, Draft Create, Sync, Task Create, Classify and Enrichment. The same key is preserved across authentication-refresh retry.

### CRM / Contact / Companies

Operator pages remain simplified and business-oriented. CRM is still a migration/read-adapter flow; Navigator originals remain untouched.

## Funnemail boundary

- Canonical source: `services/funnemail-boundary/index.ts` in Nexus.
- Original repo `tmwe-dev/funnemail`: read-only source of truth.
- Supabase project: `rxocvyfhsqduowltmfbp`.
- Edge Function: `funnemail-nexus-v1`.
- Function ID: `c21744fb-f6d1-44bf-9c3f-2ecd9daf6bf5`.
- Deployed version: **6**.
- Status: **ACTIVE**.
- Auth: delegated Funnemail user JWT, boundary-side validation, user-scoped RLS.
- No service-role mailbox key is exposed to the browser.

Boundary-preferred functionality covers auth, messages, dashboard, message status, drafts, send, sync, classification, tasks, senders, rules, compose and enrichment.

## Reclassify bug fixed

The previous Nexus route referenced missing `funnemail-reclassify-now` and could delegate explicit user IDs to `funnemail-reclassify-batch`, which is service-role-only and independently selects messages.

The new Nexus route deduplicates explicit IDs and classifies exactly those IDs through canonical `/classify`; rollback compatibility also uses existing `funnemail-classify` per exact ID.

No normal simplified Mail action now prefers a direct legacy/private-database route.

## Durable Nexus Control Plane — ACTIVE

The owner chose to reuse the existing Supabase project rather than create a separate paid project.

Isolation model:

- same Supabase project: `rxocvyfhsqduowltmfbp`;
- dedicated schema: `nexus_control_plane`;
- operational Funnemail tables remain unchanged;
- Nexus ledger table is not directly accessible to `anon` or `authenticated`;
- only restricted RPC entrypoints are exposed.

Migration source:

`control-plane/migrations/202608130001_create_idempotency_ledger.sql`

Applied migration:

`create_nexus_control_plane_idempotency_ledger`

Ledger table:

`nexus_control_plane.idempotency_ledger`

Stored data is metadata only: capability, actor, idempotency key, request hash, state, result reference/status and timestamps. No message bodies or business payloads are stored.

### Service RPCs

Only `service_role` may execute:

- `public.nexus_idempotency_claim`
- `public.nexus_idempotency_complete`
- `public.nexus_idempotency_probe`

### User-scoped RPCs

Authenticated Funnemail users may execute:

- `public.nexus_user_idempotency_claim`
- `public.nexus_user_idempotency_complete`

These functions derive the actor from `auth.uid()` internally. The caller cannot choose another user actor and cannot directly read the ledger table.

### Runtime ledger verification

The deterministic service path passed:

1. first claim → `execute`;
2. same key/hash while pending → `in_progress`;
3. same key/different hash → `conflict`;
4. complete → `true`;
5. same key/hash after completion → `replay`.

Synthetic test rows were removed afterwards.

The user-scoped RPC was also executed under simulated `authenticated` role/JWT context and returned `execute`, confirming actor derivation through `auth.uid()`.

### Mail enforcement without service secret

`modules/idempotency/ledger.js` uses the user-scoped RPC path for `funnemail-user` requests:

- public non-secret Control Plane URL/default publishable key;
- Funnemail user JWT forwarded as bearer token;
- actor bound to `auth.uid()` inside Postgres;
- no `service_role` credential required for normal Mail operations.

Modes are split by actor:

- `NEXUS_USER_IDEMPOTENCY_MODE=enforce` by default;
- `NEXUS_SERVICE_IDEMPOTENCY_MODE=audit` by default;
- `NEXUS_IDEMPOTENCY_MODE` remains only the legacy fallback for service mode.

This allows durable enforcement for Mail without blocking Cobra/service workflows that do not yet have a server-only Control Plane key.

## Idempotency coverage

Nexus ledger wrappers cover retry-sensitive Mail mutations:

- `email.draft.create.v1`;
- `email.send.v1`;
- `email.sync.v1`;
- `email.task.create.v2`;
- `email.classify.v1`;
- `email.reclassify.v1`;
- `email.enrich.v1`;
- `email.rules.apply.v1`.

`registry/capabilities.js` is aligned: `email.rules.apply.v1` is marked `idempotency_required:true`.

Database inspection confirmed `fn_create_task_from_mail` is a pure insert and the task table has no uniqueness constraint preventing retry duplicates, so task idempotency is required.

## Supabase advisor result for Nexus schema

Security advisor reports one INFO item specific to Nexus: RLS enabled with no policy on `nexus_control_plane.idempotency_ledger`. This is intentional because direct table access is revoked and all access goes through restricted SECURITY DEFINER RPCs.

The advisor also flags the two authenticated Nexus user RPCs because they are intentionally SECURITY DEFINER and executable by authenticated users. This exposure is deliberate and constrained: actor identity comes from `auth.uid()`, the hidden schema/table remain inaccessible, and the RPC input does not accept an actor/user identifier.

Other security/performance advisor findings belong to the original Funnemail public schema. They are not modified during this Nexus extraction phase because original/source behavior is read-only under `RULES.md`.

## Conformance evidence system

API:

`GET /api/funnemail/conformance`

Admin page:

`/funnemail-conformance.html`

The runner requires a verified Funnemail user session and compares boundary vs rollback compatibility read-only using hashes/counts/PASS-FAIL. It does not display/copy message bodies.

Authenticated browser execution still requires a real Mail session; no green score is fabricated without that evidence.

## Migration gates

`modules/migration/capabilityMap.js` tracks the complete Funnemail capability surface.

Current conservative readiness remains **40/100** where only structural contract + rollback evidence exists:

- contract: 25/25;
- shadow/conformance: 0/25 until runner evidence exists;
- callers migrated: 0/20 until caller evidence is complete;
- rollback: 15/15;
- observability: 0/15 until per-capability runtime evidence is complete.

The durable-idempotency infrastructure blocker is closed, but that alone does not authorize legacy removal. Only 100/100 authorizes deprecation/removal.

## Resilience

`modules/funnemail/serviceClient.js` uses the Nexus circuit breaker:

- threshold 3 consecutive failures;
- open/reset 30 seconds;
- half-open retry;
- default boundary timeout 12 seconds;
- no silent runtime fallback to the legacy DB after target failure.

## Remaining evidence/blockers for Funnemail cutover

1. Execute authenticated `/funnemail-conformance.html` and investigate any mismatch.
2. Collect active-caller evidence before marking callers migrated.
3. Run controlled side-effect conformance before legacy deletion.
4. Per-capability observability evidence must be sufficient for migration gates.

These are evidence/cutover gates, not missing normal Mail functionality or missing Control Plane infrastructure.

## Next phase after Funnemail evidence closes

- extend the isolated Control Plane/resilience pattern to other cross-service clients;
- simplify Cobra into an assistant/workflow orchestration layer;
- add server-to-server Control Plane credentials only when needed for Cobra/workflow enforcement;
- continue CRM/Navigator extraction with independent ownership boundaries;
- keep TMWE2 last unless the owner changes migration order.

## Production protection

- Original applications/repositories remain untouched.
- Never commit or expose service-role credentials.
- Never remove compatibility adapters until all migration gates pass.
- Never broad-merge this working branch solely to preview UI changes.
