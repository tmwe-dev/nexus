# TMWE Nexus — Current State

This file is the durable handoff for autonomous continuation between sessions.

Authoritative rules: `RULES.md`.

## Active objective

Build TMWE Nexus to completion while keeping legacy/original systems read-only, copying/porting required logic into the new TMWE/Nexus infrastructure, simplifying the operator experience, and preserving working business behavior.

The current immediate program is:

1. simplify the operator UI;
2. preserve functionality behind the simplified UI;
3. verify canonical routing for each visible action;
4. remove routing ambiguity and temporary coupling only after replacement paths pass migration gates;
5. complete durable idempotency/control-plane requirements;
6. integrate applications progressively, with TMWE2 last unless the owner changes the order.

## Repository / branch

- Repository: `tmwe-dev/nexus`
- Working branch: `agent/control-plane-canonical-router`
- Draft PR: `#51`
- Production branch: `main`
- Production domain: `tmwe-nexus.vercel.app`
- Working branch is deployed by the existing GitHub → Vercel Preview integration.
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

## UI simplification completed in this work cycle

The following operator pages have been simplified on the working branch without changing original source systems:

### Home — `public/index.html`

- technical System Map is no longer the primary experience;
- primary question is `Cosa vuoi fare?`;
- direct business entries: Mail, CRM, Aziende;
- Navigator, Cobra and BarTalk are visible as future modules without pretending they are live;
- administration/system diagnostics remain reachable but secondary.

### Mail — `public/funnemail.html`

- removed capability/runtime/service-boundary terminology from the normal workflow;
- primary navigation: Scrivi, Inbox, Bozze;
- secondary features moved under `Altro`: Mittenti, Task, Regole, Sincronizza;
- preserved search, message reading, read/unread, archive, trash, flag, task creation, classification, AI compose, draft management, senders, tasks, rules, sync and enrichment;
- browser now sends a fresh `Idempotency-Key` for each intentional Send, Draft Create and Sync action;
- the same key is preserved if the API helper retries after session refresh because retry reuses the original request options.

### CRM — `public/crm.html`

- removed health/storage/read-mode diagnostics from operator view;
- primary tabs are Contatti, Aziende, Opportunità;
- search remains available;
- contact links continue to open contact detail;
- opportunity/pipeline view remains available.

### Contact — `public/contact.html`

- removed raw normalized payload and identity/provenance diagnostics from operator view;
- shows useful contact profile fields and direct email/phone actions;
- attempts to load recent activities through the existing CRM activities API.

### Companies — `public/companies.html`

- renamed/reframed as a simple Aziende search;
- removed registry/infrastructure terminology from the operator view.

## Funnemail integration state

- Funnemail remains an independent source system.
- Funnemail service boundary source repo: `tmwe-dev/funnemail`.
- Boundary function: `funnemail-nexus-v1`.
- Supabase project: Funnemail project `rxocvyfhsqduowltmfbp`.
- The boundary has already been deployed ACTIVE in Supabase.
- Auth model for the six stable user-scoped capabilities is delegated Funnemail user JWT; no shared Nexus service secret is needed for those six paths.
- Nexus branch service client is aligned to that delegated-user-token model.
- Legacy/direct Supabase compatibility paths still exist and must not be removed until conformance/rollback gates pass.

## Remaining technical blockers / debt

1. Dedicated Nexus Control Plane persistence has not yet been identified/created.
2. `control-plane/migrations/202608130001_create_idempotency_ledger.sql` exists but has not yet been applied to a dedicated Nexus Control Plane database.
3. `NEXUS_CONTROL_PLANE_URL/KEY` are therefore not live.
4. Idempotency must remain fail-safe/audit-compatible until the durable ledger is live and verified.
5. Funnemail source documentation/PR must be reconciled with the actually deployed delegated-user-JWT boundary to avoid source/deploy drift.
6. Funnemail draft PR remains unmerged even though the Edge boundary is deployed; reconcile before declaring source/deploy parity.
7. Circuit-breaker implementation exists but still needs to be wired through common cross-service paths.
8. Cobra still contains compatibility/orchestration debt and must be simplified after the current operator-path/routing pass.
9. Agent framework remains incomplete/skeletal.
10. Working branch contains a large backend delta from `main`; production merge requires a deliberate release decision, not an incidental UI publish.

## Next autonomous actions

When work resumes, do not ask for authorization to continue. Execute in this order unless the owner changes the objective:

1. verify the latest Vercel Preview build for the UI changes;
2. inspect Home, Mail, CRM, Contact and Aziende for runtime/JS failures;
3. fix any preview failures without touching originals;
4. map every visible operator action to its canonical Nexus route/service owner;
5. remove or hide any remaining technical-only UI from normal workflows;
6. close Funnemail source/deploy documentation drift;
7. establish dedicated Nexus Control Plane persistence and apply the idempotency ledger migration;
8. switch idempotency to enforced mode only after durable storage and browser behavior are verified;
9. wire graceful degradation/circuit breaking into canonical service paths;
10. continue application-by-application integration, with TMWE2 last.

## Production protection

- Original applications/repositories remain untouched.
- Do not put service-role keys or secrets in browser code or GitHub.
- Do not remove compatibility adapters until migration gates are fully satisfied.
- Do not make a broad production merge merely to preview UI work.
