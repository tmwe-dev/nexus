# TMWE Nexus — Current State

This file is the durable handoff for autonomous continuation between sessions.

Authoritative rules: `RULES.md`.

## Active objective

Build TMWE Nexus to completion while keeping legacy/original systems read-only, copying/porting required logic into the new TMWE/Nexus infrastructure, simplifying the operator experience, and preserving working business behavior.

Current program:

1. simplify operator UI;
2. preserve required functionality behind the simplified UI;
3. verify canonical routing for every visible action;
4. migrate compatibility paths toward Nexus-owned boundaries without touching originals;
5. remove temporary coupling only after migration gates pass;
6. complete durable idempotency/control-plane requirements;
7. integrate applications progressively, with TMWE2 last unless the owner changes the order.

## Repository / branch

- Repository: `tmwe-dev/nexus`
- Working branch: `agent/control-plane-canonical-router`
- Draft PR: `#51`
- Production branch: `main`
- Production domain: `tmwe-nexus.vercel.app`
- Working branch deploys automatically through GitHub → Vercel Preview.
- Do not merge the complete working branch into production merely to inspect UI changes.

## Rules now persisted

`RULES.md` is the authoritative constitution and includes:

- original/legacy systems are read-only unless the owner explicitly orders a change to that original;
- required legacy code/logic is copied, ported, adapted or reimplemented in Nexus/new infrastructure;
- autonomous continuation remains active until the requested objective is complete;
- new sessions resume from durable project state without asking for permission to continue;
- one owner/source of truth per capability/datum;
- no private cross-service database reading as final architecture;
- graceful degradation, idempotency and migration gates;
- complexity belongs in the backend, not in the normal operator UI;
- production changes must remain deliberate and reversible.

## UI simplification completed

### Home — `public/index.html`

- technical System Map is no longer the primary experience;
- primary question is `Cosa vuoi fare?`;
- direct business entries: Mail, CRM, Aziende;
- Navigator, Cobra and BarTalk are visible as future modules without pretending they are live;
- administration/system diagnostics remain reachable but secondary.

### Mail — `public/funnemail.html`

- capability/runtime/service-boundary terminology removed from normal workflow;
- primary navigation: Scrivi, Inbox, Bozze;
- secondary features under `Altro`: Mittenti, Task, Regole, Sincronizza;
- preserved search, message reading, read/unread, archive, trash, flag, task creation, classification, AI compose, draft management, senders, tasks, rules, sync and enrichment;
- browser sends a fresh `Idempotency-Key` for each intentional Send, Draft Create and Sync action;
- retry after session refresh preserves the original request options and therefore the same key.

### CRM — `public/crm.html`

- health/storage/read-mode diagnostics removed from operator view;
- primary tabs: Contatti, Aziende, Opportunità;
- search and contact detail links preserved;
- pipeline/opportunity view preserved.

### Contact — `public/contact.html`

- raw normalized payload and identity/provenance diagnostics removed;
- useful profile fields plus direct email/phone actions;
- recent activities loaded through existing CRM activities API when available.

### Companies — `public/companies.html`

- reframed as simple Aziende search;
- registry/infrastructure terminology removed.

## Vercel verification

- Simplified UI commit `11a94736f3138e2fc8644ceb4dadf850062e9350` built successfully on Vercel Preview.
- Durable-state commit also built successfully.
- Preview is protected and cannot be opened by the current Vercel connector identity, but Vercel CI status is `success`.

## Funnemail integration state

- Funnemail remains an independent source system and must now be treated as read-only.
- Original/source repository: `tmwe-dev/funnemail`.
- Canonical Nexus-owned boundary source: `services/funnemail-boundary/index.ts`.
- Deployment notes: `services/funnemail-boundary/README.md`.
- Boundary function: `funnemail-nexus-v1`.
- Supabase project: `rxocvyfhsqduowltmfbp`.
- Boundary was redeployed from the Nexus-owned copy and is now Supabase Edge Function version `2`, status `ACTIVE`, `verify_jwt=false` with custom delegated-user authentication inside the function.
- Auth model for stable user-scoped capabilities: delegated Funnemail user JWT; no shared Nexus service secret.
- Nexus service client is aligned to delegated-user-token model.
- Legacy/direct Supabase compatibility paths remain and must not be removed until conformance/rollback gates pass.

## Operator route map

Canonical route inventory is persisted in `docs/OPERATOR_ROUTE_MAP.md`.

Current Funnemail split:

### Stable boundary available

- message search/read;
- draft create;
- send;
- sync;
- classify.

### Still compatibility/legacy-backed

- dashboard counters;
- message status mutations (read/unread/archive/trash/flag);
- task board/create/update/delete;
- rules;
- sender intelligence;
- AI compose;
- enrichment;
- login/refresh/user helpers still use compatibility auth adapter.

These paths must be migrated progressively; do not delete them prematurely.

## CRM state

- Operator UI is simplified.
- CRM contact search still reads through `navigator-read-adapter+identity-resolver`.
- Contact read has a routing layer capable of Nexus independent store/shadow mode.
- Original Navigator data remains source of truth until migration gates authorize cutover.

## Remaining technical blockers / debt

1. Dedicated Nexus Control Plane persistence has not yet been identified/created.
2. `control-plane/migrations/202608130001_create_idempotency_ledger.sql` exists but is not applied to a dedicated Nexus Control Plane database.
3. `NEXUS_CONTROL_PLANE_URL/KEY` are therefore not live.
4. Idempotency must remain audit/fail-safe compatible until durable ledger is live and verified.
5. Existing Funnemail source PR/branch is historical compatibility work; future boundary changes must occur in Nexus-owned `services/funnemail-boundary/`, not in the original repo.
6. Circuit-breaker implementation exists but still needs wiring through common cross-service paths.
7. Cobra contains compatibility/orchestration debt and must be simplified after the current routing migration pass.
8. Agent framework remains incomplete/skeletal.
9. Working branch contains a large backend delta from `main`; production merge requires a deliberate release decision.
10. Preview visual inspection is blocked by current Vercel connector identity even though builds succeed.

## Next autonomous actions

When work resumes, do not ask for authorization to continue. Execute in this order unless the owner changes the objective:

1. migrate the remaining visible Funnemail operator actions from compatibility adapter to the Nexus-owned Funnemail boundary, starting with message status + dashboard because they are used by Inbox;
2. preserve fallback only while required by migration gates;
3. extend conformance evidence for each migrated route;
4. establish dedicated Nexus Control Plane persistence and apply the idempotency ledger migration when project/organization creation can be performed safely;
5. switch idempotency to enforced mode only after durable storage and browser behavior are verified;
6. wire graceful degradation/circuit breaking into canonical service paths;
7. simplify Cobra and route it as an assistant rather than a technical app;
8. continue application-by-application integration, with TMWE2 last.

## Production protection

- Original applications/repositories remain untouched.
- Do not put service-role keys or secrets in browser code or GitHub.
- Do not remove compatibility adapters until migration gates are fully satisfied.
- Do not make a broad production merge merely to preview UI work.
