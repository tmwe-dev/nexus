# Funnemail Conformance Checkpoint

`RULES.md` and `docs/MIGRATION_GATES.md` are authoritative.

This report intentionally distinguishes structural evidence from authenticated runtime evidence. A capability is **not** declared ready to deprecate merely because its boundary route exists.

## Evidence available

### Source immutability

PASS.

Future integration source is held in `services/funnemail-boundary/` inside Nexus. The original `tmwe-dev/funnemail` repository is treated as read-only.

### Stable boundary deployment

PASS.

Supabase reports `funnemail-nexus-v1`, deployed version `6`, status `ACTIVE`, with explicit boundary-side user validation.

### Nexus routing

PASS structurally for every normal simplified Mail operator action listed in `docs/OPERATOR_ROUTE_MAP.md`.

The Funnemail target has a canonical public registry default. `email.reclassify.v1` was repaired: Nexus no longer references missing `funnemail-reclassify-now` and no longer routes delegated users into the service-role-only batch selector. Exact requested IDs are classified through canonical `/classify`.

### Durable idempotency infrastructure

PASS for the Funnemail user-scoped path.

The user chose to reuse the existing Supabase project without creating a second paid project. Nexus storage is isolated in the dedicated schema:

`nexus_control_plane`

The ledger table is:

`nexus_control_plane.idempotency_ledger`

Direct access is denied to `anon` and `authenticated`. User-scoped RPCs derive actor identity from `auth.uid()` and cannot operate on another user's actor key.

Verified privilege model:

- anon schema usage: false;
- authenticated schema usage: false;
- anon table select: false;
- authenticated table select: false;
- anon user claim execution: false;
- authenticated user claim execution: true;
- authenticated service claim execution: false.

The service-role RPC path was tested directly against Supabase and passed:

1. first claim → `execute`;
2. duplicate while pending → `in_progress`;
3. completion → `true`;
4. same key/hash after completion → `replay`;
5. same key/different hash → `conflict`.

The test ledger record was deleted after verification.

### Mail idempotency path

PASS structurally with durable storage available.

The Mail browser sends an `Idempotency-Key` for intentional:

- Send;
- Draft Create;
- Sync;
- Task Create;
- Classify;
- Enrichment.

The corresponding Nexus APIs use the ledger wrapper where required. `email.reclassify.v1` and `email.rules.apply.v1` are also ledger-wrapped.

For `funnemail-user` requests, `modules/idempotency/ledger.js` calls authenticated user-scoped RPCs using the delegated Funnemail JWT. No service-role credential is required for normal Mail idempotency.

An authentication-refresh retry preserves the same idempotency key.

`NEXUS_IDEMPOTENCY_MODE` remains `audit` by default. Requests carrying a key already use durable storage in audit mode; broad `enforce` remains deferred until service-to-service actors such as Cobra also have a configured durable path.

### Authenticated read-only conformance runner

IMPLEMENTED; execution still requires a valid browser Mail session plus rollback-adapter configuration.

- API: `GET /api/funnemail/conformance`
- Admin page: `/funnemail-conformance.html`
- verified Funnemail user session required;
- read-only comparisons only;
- auth identity, first 50 message projections, dashboard, drafts, tasks and rules;
- outputs hashes/counts/PASS-FAIL only, not message bodies.

### Runtime authenticated comparison

NOT YET EXECUTED.

The runner exists, but this agent execution does not possess a user's Funnemail session token. A green runtime score is therefore not fabricated.

### Side-effect conformance

NOT YET PROVED.

No destructive/side-effect shadow calls were issued merely to obtain a green score. Send, Sync, status mutations, draft actions, task creation, rules application, enrichment and classification mutations require controlled evidence appropriate to their semantics.

### Rollback

PASS structurally.

Compatibility adapters remain in Nexus. Runtime target errors do not silently fall through to legacy access; rollback is an explicit routing/configuration decision. Original source repositories remain unchanged.

### Observability

PARTIAL.

- Vercel validates branch builds;
- Supabase reports the Funnemail boundary ACTIVE;
- Control Plane claim/replay/conflict behavior is verified;
- Funnemail service client exposes circuit-breaker state;
- conformance has a repeatable read-only runner;
- per-capability runtime/caller evidence is still incomplete.

## Supabase advisors

The only advisor item specific to the new Nexus schema is `RLS enabled no policy` on the ledger table. This is intentional: direct schema/table privileges are revoked and access is only through restricted SECURITY DEFINER RPCs.

Other security/performance findings belong to the original Funnemail public schema and are not modified during this Nexus extraction phase under `RULES.md`.

## Migration-gate scoring

`modules/migration/capabilityMap.js` tracks the complete Funnemail capability surface exposed by Nexus Mail APIs.

The intentionally conservative current score remains **40/100** until real runtime evidence exists:

- contract compatibility: 25/25;
- shadow/conformance: 0/25;
- callers migrated: 0/20 until active-caller evidence is complete;
- rollback ready: 15/15;
- observability ready: 0/15 until per-capability/runtime evidence is complete.

Durable idempotency is no longer a blocker for the Funnemail user path, but migration score is not increased by infrastructure existence alone. Only 100/100 authorizes legacy removal.

## Capability checkpoint

| Capability group | Contract/route | Boundary preferred | Runtime conformance | Safe to deprecate legacy |
|---|---:|---:|---:|---:|
| Auth login/refresh/user | PASS | PASS | RUNNER READY | NO |
| Message search/read | PASS | PASS | RUNNER READY | NO |
| Dashboard | PASS | PASS | RUNNER READY | NO |
| Message status | PASS | PASS | NOT PROVED | NO |
| Draft list | PASS | PASS | RUNNER READY | NO |
| Draft create/safe action | PASS | PASS | MUTATION EVIDENCE PENDING | NO |
| Send | PASS | PASS | durable idempotency READY; mutation evidence pending | NO |
| Sync | PASS | PASS | durable idempotency READY; mutation evidence pending | NO |
| Classify/Reclassify | PASS | PASS | durable idempotency READY; mutation evidence pending | NO |
| Tasks list | PASS | PASS | RUNNER READY | NO |
| Task create | PASS | PASS | durable idempotency READY; mutation evidence pending | NO |
| Senders | PASS | PASS | structural only | NO |
| Rules list | PASS | PASS | RUNNER READY | NO |
| Rule apply | PASS | PASS | durable idempotency READY; mutation evidence pending | NO |
| Compose | PASS | PASS | structural only | NO |
| Enrichment | PASS | PASS | durable idempotency READY; mutation evidence pending | NO |

## Current conclusion

The **routing/extraction and durable-idempotency infrastructure portion of the Funnemail phase is complete**. Normal Mail actions prefer the Nexus-owned boundary, reclassification routing is fixed, retry-sensitive writes have a durable user-scoped ledger path, and a read-only conformance runner exists.

Remaining cutover blockers are evidence-only:

1. authenticated execution of the read-only conformance runner;
2. active-caller evidence;
3. controlled side-effect conformance;
4. sufficient per-capability observability evidence.

Neither blocker is bypassed or hidden to manufacture a 100/100 score.
