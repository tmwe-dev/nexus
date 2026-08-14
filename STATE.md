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

The **Funnemail routing/extraction phase is complete at code level**.

Normal Mail actions now prefer the Nexus-owned Funnemail boundary. The phase is not yet authorized for legacy deletion or production cutover because durable Control Plane idempotency and authenticated migration evidence remain deliberately unresolved.

## UI simplification completed

### Home

Business-first entry points: Mail, CRM, Aziende. Technical diagnostics stay under Administration.

### Mail

Primary navigation: Scrivi, Inbox, Bozze. Secondary functions: Mittenti, Task, Regole, Sincronizza.

The browser generates an `Idempotency-Key` for intentional:

- Send;
- Draft Create;
- Sync;
- Task Create;
- Classify;
- Enrichment.

The same key is preserved across an authentication-refresh retry.

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

The public target URL is defined centrally by `registry/connections.js`; `FUNNEMAIL_BASE_URL` is only an optional override.

## Reclassify bug fixed

The previous Nexus `api/email/reclassify.js` had two real routing defects:

1. it referenced `funnemail-reclassify-now`, which no longer exists;
2. its batch route could invoke `funnemail-reclassify-batch`, which is service-role-only and independently selects messages rather than honoring explicit user `message_ids`.

The new Nexus route now:

- deduplicates explicit message IDs;
- single ID → canonical `/classify` boundary;
- explicit ID array → one canonical `/classify` call per requested ID;
- rollback compatibility also uses existing `funnemail-classify` per exact ID;
- is wrapped by Nexus idempotency for API callers.

No normal simplified Mail action now prefers a direct legacy/private-database route.

## Idempotency preparation

Nexus ledger wrappers now cover retry-sensitive Mail mutations including:

- `email.draft.create.v1`;
- `email.send.v1`;
- `email.sync.v1`;
- `email.task.create.v2`;
- `email.classify.v1`;
- `email.reclassify.v1`;
- `email.enrich.v1`;
- `email.rules.apply.v1` in the API.

Database inspection confirmed `fn_create_task_from_mail` is a pure insert and the task table has no uniqueness constraint preventing duplicate task creation, so task idempotency is required rather than cosmetic.

`email.message.status.v1` and safe draft status operations remain state-setting operations and are not treated like send/create commands.

One registry-documentation mismatch remains: the API for `email.rules.apply.v1` is ledger-wrapped, but the attempted GitHub write changing its registry `idempotency_required` flag to true was blocked by the connector safety layer. Rules Apply is not exposed as a normal operator action. Correct that single flag before any future Rules Apply cutover decision.

## Control Plane migration hardening

Migration file:

`control-plane/migrations/202608130001_create_idempotency_ledger.sql`

was hardened before deployment:

- explicit RLS enabled;
- table privileges revoked from PUBLIC/anon/authenticated;
- only service_role gets ledger table privileges;
- claim function execute revoked from PUBLIC/anon/authenticated and granted to service_role;
- SECURITY DEFINER search path set to `public, pg_temp`;
- ledger stores metadata/request hash/result reference only, never business payloads/message bodies.

The migration has **not** been applied because no dedicated Nexus Control Plane project exists yet.

## Conformance evidence system

New API:

`GET /api/funnemail/conformance`

New admin page:

`/funnemail-conformance.html`

The runner:

- requires a verified Funnemail user session;
- is read-only;
- compares boundary vs rollback compatibility using the same user;
- checks auth identity, first 50 message projections, dashboard, first 100 drafts, tasks and rules;
- returns SHA256 hashes/counts/PASS-FAIL only;
- does not display or copy message bodies.

It cannot be executed by the agent without a real user Mail session and rollback-adapter configuration. A runtime green score must not be fabricated.

## Migration gates

`modules/migration/capabilityMap.js` now tracks the complete Funnemail capability surface instead of only the original six contracts.

Current conservative readiness is **40/100** per tracked capability where only structural contract + rollback evidence exists:

- contract: 25/25;
- shadow/conformance: 0/25 until runner evidence exists;
- callers migrated: 0/20 until caller evidence is complete;
- rollback: 15/15;
- observability: 0/15 until runtime evidence is complete.

Only 100/100 authorizes deprecation/removal.

## Resilience

`modules/funnemail/serviceClient.js` uses the Nexus circuit breaker:

- threshold 3 consecutive failures;
- open/reset 30 seconds;
- half-open retry;
- default boundary timeout 12 seconds;
- no silent runtime fallback to the legacy DB after target failure.

## Dedicated Nexus Control Plane — required external confirmation

Supabase inventory contains no project clearly dedicated to Nexus Control Plane.

Do not repurpose Funnemail, CRM, WCA or another unrelated database.

The user has been asked to confirm whether organization `jicausywrokuftbjatjy` should be used to create `nexus-control-plane`. Supabase tooling then requires a separate cost confirmation before project creation.

After confirmation:

1. obtain project cost for that organization;
2. present/confirm cost as required by the Supabase tool;
3. create `nexus-control-plane` (preferred region `eu-central-1` unless changed);
4. apply the hardened ledger migration;
5. run Supabase security/performance advisors;
6. verify claim/replay/conflict/in-progress behavior;
7. configure `NEXUS_CONTROL_PLANE_URL` and server-only `NEXUS_CONTROL_PLANE_KEY`;
8. only then consider `NEXUS_IDEMPOTENCY_MODE=enforce`.

## Remaining evidence/blockers for this phase

1. Dedicated Nexus Control Plane provisioning and secure server-side key configuration.
2. Authenticated execution of `/funnemail-conformance.html` and review of any mismatches.
3. Active-caller evidence before marking callers migrated.
4. Controlled side-effect conformance before legacy deletion.
5. Correct the single `email.rules.apply.v1` registry idempotency flag when GitHub connector permits the write.

These are cutover/evidence blockers, not missing normal Mail routing functionality.

## Next phase after Funnemail evidence closes

- extend resilience/idempotency patterns to other cross-service clients;
- simplify Cobra into an assistant/workflow orchestration layer;
- continue CRM/Navigator extraction with independent ownership boundaries;
- keep TMWE2 last unless the owner changes migration order.

## Production protection

- Original applications/repositories remain untouched.
- Never commit or expose service-role credentials.
- Never remove compatibility adapters until all migration gates pass.
- Never broad-merge this working branch solely to preview UI changes.
