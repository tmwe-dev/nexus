# Funnemail Conformance Checkpoint

`RULES.md` and `docs/MIGRATION_GATES.md` are authoritative.

This report intentionally distinguishes structural evidence from authenticated runtime evidence. A capability is **not** declared ready to deprecate merely because its boundary route exists.

## Evidence available

### Source immutability

PASS.

Future integration source is held in `services/funnemail-boundary/` inside Nexus. The original `tmwe-dev/funnemail` repository is treated as read-only.

### Stable boundary deployment

PASS for deployment existence.

Supabase directly reports:

- function `funnemail-nexus-v1`;
- deployed version `6`;
- status `ACTIVE`;
- explicit custom authentication model (`verify_jwt=false` with boundary-side user validation).

### Nexus routing

PASS structurally for every normal simplified Mail operator action listed in `docs/OPERATOR_ROUTE_MAP.md`.

The Funnemail target has a canonical public registry default, so target selection does not depend on an unverified Vercel environment variable. Environment configuration may override the target but is not required for the normal target URL.

`email.reclassify.v1` has also been repaired. The previous route referenced a missing `funnemail-reclassify-now` function and could send explicit user message IDs into a service-role-only batch function whose own selection logic did not honor those IDs. Nexus now reclassifies the exact requested message IDs through the canonical `/classify` boundary path.

### Browser idempotency intent

PASS structurally for intentional:

- Send;
- Draft Create;
- Sync.

The simplified Mail UI creates an `Idempotency-Key` per intentional action and preserves it through a session-refresh retry.

### Durable idempotency

BLOCKED / NOT PASS.

The durable control-plane migration exists, but no dedicated Nexus Control Plane database has yet been explicitly provisioned. Do not mark this gate complete and do not switch enforce mode on.

### Runtime authenticated comparison

NOT YET PROVED.

No authenticated Funnemail user session has been supplied to this execution environment for safe read-side old-vs-boundary comparison. Therefore runtime equality evidence remains outstanding even though route and implementation equivalence are structurally mapped.

### Side-effect conformance

NOT YET PROVED.

No destructive/side-effect shadow calls were issued merely to obtain a green score. Send, Sync, status mutations, draft actions, task create, rule application, enrichment and classification mutations require controlled evidence appropriate to their semantics.

### Rollback

PASS structurally.

Compatibility adapters remain in Nexus. Runtime target errors do not silently fall through to legacy access; rollback is an explicit routing/configuration decision. Original source repositories remain unchanged.

### Observability

PARTIAL.

- Vercel Git integration reports successful builds for the working branch checkpoints.
- Supabase reports the boundary deployment ACTIVE.
- Funnemail service client exposes in-memory circuit-breaker state.
- Dedicated durable control-plane observability remains blocked with the Control Plane database.

## Migration-gate scoring

`modules/migration/capabilityMap.js` now tracks the complete Funnemail capability surface exposed by the Nexus Mail APIs rather than only the original six capabilities.

The intentionally conservative current score for these capabilities is **40/100**:

- contract compatibility: 25/25;
- shadow/conformance: 0/25;
- callers migrated: 0/20 until global active-caller evidence is complete;
- rollback ready: 15/15;
- observability ready: 0/15 until per-capability/runtime evidence is complete.

A score of 40 is **not** a failure of the boundary; it means deprecation is correctly blocked until evidence exists. Only 100/100 authorizes legacy removal.

## Capability checkpoint

| Capability group | Contract/route | Boundary preferred | Authenticated runtime conformance | Safe to deprecate legacy |
|---|---:|---:|---:|---:|
| Auth login/refresh/user | PASS | PASS | NOT PROVED | NO |
| Message search/read | PASS | PASS | NOT PROVED | NO |
| Dashboard | PASS | PASS | NOT PROVED | NO |
| Message status | PASS | PASS | NOT PROVED | NO |
| Draft list/create/safe action | PASS | PASS | NOT PROVED | NO |
| Send | PASS | PASS | NOT PROVED + durable idempotency blocked | NO |
| Sync | PASS | PASS | NOT PROVED + durable idempotency blocked | NO |
| Classify | PASS | PASS | NOT PROVED | NO |
| Reclassify explicit IDs | PASS | PASS through `/classify` | NOT PROVED | NO |
| Tasks list/create | PASS | PASS | NOT PROVED | NO |
| Senders | PASS | PASS | NOT PROVED | NO |
| Rules | PASS | PASS | NOT PROVED | NO |
| Compose | PASS | PASS | NOT PROVED | NO |
| Enrichment | PASS | PASS | NOT PROVED | NO |

## Current conclusion

The **routing/extraction portion of the Funnemail phase is complete**: normal Mail actions prefer the Nexus-owned boundary and the remaining historical bug in `reclassify` has been removed from the preferred path.

The phase is **not yet eligible for legacy deletion or production cutover** because two independent evidence blocks remain:

1. authenticated runtime conformance / active-caller evidence;
2. durable Nexus Control Plane idempotency.

Neither blocker is bypassed or hidden to manufacture a 100/100 score.
