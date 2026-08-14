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
- version `6`;
- status `ACTIVE`;
- explicit custom authentication model (`verify_jwt=false` with boundary-side user validation).

### Nexus routing

PASS structurally for the boundary-preferred routes listed in `docs/OPERATOR_ROUTE_MAP.md`.

The Funnemail target has a canonical public registry default, so target selection does not depend on an unverified Vercel environment variable. Environment configuration may override the target but is not required for the normal target URL.

### Browser idempotency intent

PASS structurally for intentional:

- Send;
- Draft Create;
- Sync.

The simplified Mail UI creates an `Idempotency-Key` per intentional action and preserves it through a session-refresh retry.

### Durable idempotency

BLOCKED / NOT PASS.

The durable control-plane migration exists, but no dedicated Nexus Control Plane database has been selected/created. Do not mark this gate complete and do not switch enforce mode on.

### Runtime authenticated comparison

NOT YET PROVED.

No authenticated user session was available to run safe read-side shadow comparisons from this execution environment. Therefore message/search/read/dashboard/draft-list/task-list/sender/rule read outputs have not yet received runtime old-vs-boundary equality evidence in this checkpoint.

### Side-effect conformance

NOT YET PROVED.

No destructive/side-effect shadow calls were issued merely to obtain a green score. Send, Sync, status mutations, draft actions, task create, rules apply and enrichment require controlled evidence appropriate to their semantics.

### Rollback

AVAILABLE STRUCTURALLY, NOT YET RELEASE-PROVED.

Compatibility adapters remain in Nexus. Runtime target errors do not silently fall through to legacy access; rollback is an explicit routing/configuration decision.

### Observability

PARTIAL.

- Vercel Git integration reports successful builds for the working branch.
- Supabase reports the boundary deployment ACTIVE.
- Funnemail service client now records circuit-breaker state in Nexus memory.
- Dedicated durable control-plane observability remains blocked with the control-plane database.

## Capability checkpoint

| Capability group | Contract/route | Boundary deployed | Authenticated runtime conformance | Safe to deprecate legacy |
|---|---:|---:|---:|---:|
| Auth login/refresh/user | PASS | PASS | NOT PROVED | NO |
| Message search/read | PASS | PASS | NOT PROVED | NO |
| Dashboard | PASS | PASS | NOT PROVED | NO |
| Message status | PASS | PASS | NOT PROVED | NO |
| Draft list/create/safe action | PASS | PASS | NOT PROVED | NO |
| Send | PASS | PASS | NOT PROVED + durable idempotency blocked | NO |
| Sync | PASS | PASS | NOT PROVED + durable idempotency blocked | NO |
| Classify | PASS | PASS | NOT PROVED | NO |
| Tasks list/create | PASS | PASS | NOT PROVED | NO |
| Senders | PASS | PASS | NOT PROVED | NO |
| Rules | PASS | PASS | NOT PROVED | NO |
| Compose | PASS | PASS | NOT PROVED | NO |
| Enrichment | PASS | PASS | NOT PROVED | NO |
| Reclassify | COMPATIBILITY | N/A | N/A | NO |

## Current conclusion

The Funnemail integration is now **architecturally much cleaner and boundary-preferred**, but **no legacy Funnemail capability is authorized for deletion yet**.

The next meaningful evidence is authenticated, non-destructive read conformance followed by carefully controlled side-effect evidence. Durable idempotency remains blocked until a dedicated Nexus Control Plane database is explicitly provisioned.
