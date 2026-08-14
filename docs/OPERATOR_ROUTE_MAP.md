# Operator Route Map

`RULES.md` is authoritative.

Purpose: map every action visible in the normal Nexus operator UI to its current execution path so routing can be simplified without deleting working behavior.

Status meanings:

- **CANONICAL** — action already uses a Nexus-owned stable service/capability path as its preferred route.
- **MIGRATION** — action is intentionally served through a read/compatibility adapter while the original remains source of truth.
- **COMPATIBILITY** — action still reaches Funnemail/legacy internals through a temporary adapter and needs a stable replacement contract before that adapter can be removed.
- **STATIC** — no business-service call.

## Home

| Visible action | UI target | Current route | Status | Required next step |
|---|---|---|---|---|
| Mail | `/funnemail.html` | static navigation | STATIC | none |
| CRM | `/crm.html` | static navigation | STATIC | none |
| Aziende | `/companies.html` | static navigation | STATIC | none |
| Amministrazione | `/system.html` | technical/admin page | STATIC | keep outside normal workflow |
| Navigator | disabled/future | none | STATIC | expose only when a real Nexus route exists |
| Cobra | disabled/future | none | STATIC | expose only when a real operator contract exists |
| BarTalk | disabled/future | none | STATIC | expose only when a real operator contract exists |

## Mail — authentication

| Visible action | Nexus API | Current execution | Status | Required next step |
|---|---|---|---|---|
| Accedi | `POST /api/funnemail/login` | Funnemail auth through `legacyAdapter.login` | COMPATIBILITY | define auth boundary separately from mailbox capability routing; do not expose secrets |
| Refresh session | `POST /api/funnemail/refresh` | Funnemail auth compatibility path | COMPATIBILITY | keep until delegated-user auth entrypoint is canonicalized |
| Current user | `GET /api/funnemail/user` | verified Funnemail user context | COMPATIBILITY | preserve user-scoped RLS semantics |

## Mail — primary operator path

| Visible action | Nexus API | Preferred execution | Status | Required next step |
|---|---|---|---|---|
| Inbox/search | `GET /api/email/messages` | `funnemail-nexus-v1 /messages` when target configured; compatibility fallback otherwise | CANONICAL | prove configured target in deployed Nexus; keep fallback until gates pass |
| Read message | `GET /api/email/message` | `funnemail-nexus-v1 /messages/:id` when target configured; compatibility fallback otherwise | CANONICAL | same as above |
| Unread/draft counters | `GET /api/email/dashboard` | `funnemail-nexus-v1 /dashboard` when target configured; compatibility fallback otherwise | CANONICAL | verify live target configuration and conformance |
| Mark read/unread | `POST /api/email/status` | `funnemail-nexus-v1 /status` when target configured; compatibility fallback otherwise | CANONICAL | verify DB + IMAP behavior against compatibility path before removing fallback |
| Archive/trash/flag | `POST /api/email/status` | `funnemail-nexus-v1 /status` when target configured; compatibility fallback otherwise | CANONICAL | same conformance/rollback requirement |
| Save draft | `POST /api/email/drafts` | idempotency ledger wrapper → `funnemail-nexus-v1 /drafts` when target configured | CANONICAL | activate durable ledger before enforce mode |
| Send | `POST /api/email/send` | idempotency ledger wrapper → `funnemail-nexus-v1 /send` when target configured | CANONICAL | activate durable ledger before enforce mode |
| Sync | `POST /api/email/sync` | idempotency ledger wrapper → `funnemail-nexus-v1 /sync` when target configured | CANONICAL | activate durable ledger before enforce mode |
| Classify | `POST /api/email/classify` | `funnemail-nexus-v1 /classify` when target configured | CANONICAL | decide whether classification remains Funnemail-owned or moves to shared AI later |

The browser generates a new `Idempotency-Key` for each intentional Draft Create, Send and Sync action and preserves the same request options across a 401/session-refresh retry.

## Mail — visible compatibility functions

| Visible action | Nexus API | Current execution | Status | Required next step |
|---|---|---|---|---|
| List drafts | `GET /api/email/drafts` | compatibility read from Funnemail draft storage | COMPATIBILITY | extend stable draft capability to list/read |
| Approve/discard draft | `POST /api/email/draft-action` | compatibility Funnemail operation | COMPATIBILITY | define stable draft-action command if behavior remains Funnemail-owned |
| AI writing assistance | `POST /api/email/compose` | existing Funnemail Edge function through compatibility adapter | COMPATIBILITY | determine final owner: Funnemail email intelligence vs shared AI platform |
| List/create tasks | `GET/POST /api/email/tasks` | compatibility Funnemail task storage/RPC | COMPATIBILITY | decide task ownership, then expose stable contract |
| Senders | `GET /api/email/senders` | compatibility Funnemail sender intelligence | COMPATIBILITY | expose only if operator value justifies a stable capability |
| Rules | `GET /api/email/rules` | compatibility Funnemail rules storage | COMPATIBILITY | keep under secondary UI; define stable contract only if retained |
| Enrichment | `POST /api/email/enrich` | existing Funnemail Edge operation through compatibility adapter | COMPATIBILITY | decide final owner with AI/research architecture |

**Rule:** none of these compatibility adapters may be deleted merely because the UI has been simplified. Delete only after replacement contract, conformance, caller migration, rollback and observability gates pass.

## CRM

Current CRM reads are migration paths by design. The original Navigator data remains source of truth while Nexus normalizes identity and can shadow/read from the independent Nexus store.

| Visible action | Nexus API | Current execution | Status | Required next step |
|---|---|---|---|---|
| Search contacts | `GET /api/crm/contacts` | CRM service → Navigator read adapter → mapper/identity resolver | MIGRATION | continue shadow/read-router migration; do not modify Navigator original |
| Search companies/accounts | `GET /api/crm/accounts` | CRM service → current source adapter/read-router model | MIGRATION | establish independent-store readiness before cutover |
| Pipeline/opportunities | `GET /api/crm/pipeline` | CRM aggregation over current migration sources | MIGRATION | verify one canonical opportunity owner/source |
| Contact detail | `GET /api/crm/contact-detail` | CRM detail service/read routing | MIGRATION | preserve identity mapping and shadow comparison |
| Contact activities | `GET /api/crm/activities` | CRM activities service | MIGRATION | confirm activity source/owner before write features are exposed |

## Aziende

| Visible action | Nexus API | Current execution | Status | Required next step |
|---|---|---|---|---|
| Search companies | `GET /api/companies` | Nexus company-registry service | CANONICAL | verify backing store/config in deployed environment |

The operator page is read-oriented even though the API also supports writes. No company write control is exposed in the simplified UI until ownership, authorization and business workflow are explicit.

## Routing cleanup order

1. Keep the simplified UI stable.
2. Prove the configured Funnemail stable target for all boundary-preferred capabilities.
3. Extend the boundary for draft list/action because drafts remain part of normal mail behavior.
4. Decide final ownership for email tasks, AI compose, enrichment, sender intelligence and rules before adding more contracts.
5. Continue CRM shadow/read-router migration without touching Navigator original files.
6. Only after conformance/rollback gates pass, remove compatibility paths with zero active callers.
