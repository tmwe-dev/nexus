# Funnemail Conformance Checkpoint

`RULES.md` and `docs/MIGRATION_GATES.md` are authoritative.

This report intentionally distinguishes structural evidence from authenticated runtime evidence. A capability is **not** declared ready to deprecate merely because its boundary route exists.

## Evidence available

### Source immutability

PASS.

Future integration source is held in `services/funnemail-boundary/` inside Nexus. The original `tmwe-dev/funnemail` repository is treated as read-only.

### Stable boundary deployment

PASS for deployment existence.

Supabase directly reports function `funnemail-nexus-v1`, deployed version `6`, status `ACTIVE`, with explicit boundary-side user validation.

### Nexus routing

PASS structurally for every normal simplified Mail operator action listed in `docs/OPERATOR_ROUTE_MAP.md`.

The Funnemail target has a canonical public registry default. `email.reclassify.v1` was repaired: Nexus no longer references the missing `funnemail-reclassify-now` function and no longer routes delegated users into the service-role-only batch selector. Exact requested IDs are classified through the canonical `/classify` boundary.

### Idempotency intent and wrappers

PASS structurally, but durable enforcement remains blocked until the Control Plane exists.

The Mail browser sends an `Idempotency-Key` for intentional:

- Send;
- Draft Create;
- Sync;
- Task Create;
- Classify;
- Enrichment.

The corresponding Nexus APIs use the durable-ledger wrapper where required. `email.reclassify.v1` is also ledger-wrapped for API callers. Rule application is ledger-wrapped in the API even though it is not exposed as a normal operator action.

An authentication-refresh retry preserves the original request options and therefore the same idempotency key.

### Durable idempotency

BLOCKED / NOT PASS.

The control-plane migration exists and was hardened before deployment:

- table access is explicitly revoked from `PUBLIC`, `anon` and `authenticated`;
- only `service_role` receives ledger table privileges;
- the claim function is executable only by `service_role`;
- the SECURITY DEFINER function uses an explicit `public, pg_temp` search path;
- the ledger stores metadata/hash/result references, never message bodies/business payloads.

No dedicated Nexus Control Plane project has yet been explicitly provisioned. Do not switch enforce mode on until the store and server-side credentials are live and verified.

### Authenticated read-only conformance runner

IMPLEMENTED, execution pending a valid browser Mail session plus rollback-adapter configuration.

- API: `GET /api/funnemail/conformance`
- Admin page: `/funnemail-conformance.html`
- requires a verified Funnemail user session;
- performs read-only comparisons only;
- compares auth identity, first 50 messages using a stable projection, dashboard, drafts, tasks and rules;
- returns hashes/counts/PASS-FAIL, not message bodies/content.

This creates a repeatable evidence mechanism without mutating original data.

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

- Vercel Git integration validates branch builds;
- Supabase reports the boundary deployment ACTIVE;
- Funnemail service client exposes circuit-breaker state;
- conformance now has a repeatable read-only runner;
- durable control-plane observability remains blocked until provisioning.

## Migration-gate scoring

`modules/migration/capabilityMap.js` tracks the complete Funnemail capability surface exposed by Nexus Mail APIs.

The intentionally conservative current score remains **40/100** until real runtime evidence exists:

- contract compatibility: 25/25;
- shadow/conformance: 0/25;
- callers migrated: 0/20 until active-caller evidence is complete;
- rollback ready: 15/15;
- observability ready: 0/15 until per-capability/runtime evidence is complete.

Only 100/100 authorizes legacy removal.

## Capability checkpoint

| Capability group | Contract/route | Boundary preferred | Runtime conformance | Safe to deprecate legacy |
|---|---:|---:|---:|---:|
| Auth login/refresh/user | PASS | PASS | RUNNER READY | NO |
| Message search/read | PASS | PASS | RUNNER READY | NO |
| Dashboard | PASS | PASS | RUNNER READY | NO |
| Message status | PASS | PASS | NOT PROVED | NO |
| Draft list | PASS | PASS | RUNNER READY | NO |
| Draft create/safe action | PASS | PASS | NOT PROVED | NO |
| Send | PASS | PASS | durable store blocked | NO |
| Sync | PASS | PASS | durable store blocked | NO |
| Classify/Reclassify | PASS | PASS | durable store + mutation evidence blocked | NO |
| Tasks list | PASS | PASS | RUNNER READY | NO |
| Task create | PASS | PASS | durable store + mutation evidence blocked | NO |
| Senders | PASS | PASS | structural only | NO |
| Rules list | PASS | PASS | RUNNER READY | NO |
| Rule apply | PASS | PASS | mutation evidence blocked | NO |
| Compose | PASS | PASS | structural only | NO |
| Enrichment | PASS | PASS | durable store + mutation evidence blocked | NO |

## Current conclusion

The **routing/extraction and idempotency-preparation portion of the Funnemail phase is complete**. Normal Mail actions prefer the Nexus-owned boundary, reclassification routing is fixed, retry-sensitive writes are ledger-ready, and a read-only conformance runner now exists.

Two external evidence blocks still prevent legacy deletion/production cutover:

1. authenticated execution of conformance and active-caller evidence;
2. provisioning/configuration of the dedicated Nexus Control Plane for durable idempotency.

Neither blocker is bypassed or hidden to manufacture a 100/100 score.
