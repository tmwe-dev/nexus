# Operator Route Map

`RULES.md` is authoritative.

Purpose: map every action visible in the normal Nexus operator UI to its preferred execution path without deleting rollback behavior prematurely.

Status meanings:

- **CANONICAL** — Nexus prefers a stable Nexus-owned boundary/capability path.
- **MIGRATION** — original remains source of truth while Nexus normalizes/shadows it.
- **COMPATIBILITY** — still prefers a legacy/compatibility path and must be migrated before deprecation.
- **STATIC** — no business-service call.

## Home

| Visible action | UI target | Status |
|---|---|---|
| Mail | `/funnemail.html` | STATIC |
| CRM | `/crm.html` | STATIC |
| Aziende | `/companies.html` | STATIC |
| Amministrazione | `/system.html` | STATIC |
| Navigator | future | STATIC |
| Cobra | future | STATIC |
| BarTalk | future | STATIC |

Technical/system information stays under Administration and is not part of the normal operator workflow.

## Funnemail canonical target

Canonical Nexus-owned source: `services/funnemail-boundary/index.ts`.

Deployed owner boundary: `funnemail-nexus-v1` on the Funnemail Supabase project.

The public non-secret boundary URL is defined once in `registry/connections.js` as `targetDefaultBase`. `FUNNEMAIL_BASE_URL` is an optional environment override, not a normal production requirement.

The old `NEXUS_FUNNEMAIL_SUPABASE_URL`, `NEXUS_FUNNEMAIL_ANON_KEY` and related adapter configuration are rollback-only compatibility settings. They are not the preferred Mail route.

## Mail — authentication

| Visible action | Nexus API | Preferred execution | Status |
|---|---|---|---|
| Accedi | `POST /api/funnemail/login` | `funnemail-nexus-v1 /auth/login` | CANONICAL |
| Refresh session | `POST /api/funnemail/refresh` | `funnemail-nexus-v1 /auth/refresh` | CANONICAL |
| Current user | `GET /api/funnemail/user` | `funnemail-nexus-v1 /auth/user` | CANONICAL |

Authentication is delegated to Funnemail Auth. Mailbox/data operations continue to use the verified Funnemail user JWT and preserve user-scoped RLS. No service-role key is exposed to the browser.

## Mail — primary operator path

| Visible action | Nexus API | Preferred execution | Status |
|---|---|---|---|
| Inbox/search | `GET /api/email/messages` | boundary `/messages` | CANONICAL |
| Read message | `GET /api/email/message` | boundary `/messages/:id` | CANONICAL |
| Counters | `GET /api/email/dashboard` | boundary `/dashboard` | CANONICAL |
| Read/unread | `POST /api/email/status` | boundary `/status` | CANONICAL |
| Archive/trash/flag | `POST /api/email/status` | boundary `/status` | CANONICAL |
| List drafts | `GET /api/email/drafts` | boundary `/drafts` | CANONICAL |
| Save draft | `POST /api/email/drafts` | idempotency wrapper → boundary `/drafts` | CANONICAL |
| Approve/discard draft | `POST /api/email/draft-action` | boundary `/drafts/:id/action` | CANONICAL |
| Send | `POST /api/email/send` | idempotency wrapper → boundary `/send` | CANONICAL |
| Sync | `POST /api/email/sync` | idempotency wrapper → boundary `/sync` | CANONICAL |
| Classify | `POST /api/email/classify` | boundary `/classify` | CANONICAL |
| AI writing assistance | `POST /api/email/compose` | boundary `/compose` | CANONICAL |
| List/create tasks | `GET/POST /api/email/tasks` | boundary `/tasks` | CANONICAL |
| Senders | `GET /api/email/senders` | boundary `/senders` | CANONICAL |
| Rules | `GET/POST /api/email/rules` | boundary `/rules` | CANONICAL |
| Enrichment / sender intel | `GET/POST /api/email/enrich` | boundary `/enrich` | CANONICAL |
| Riclassifica | `POST /api/email/reclassify` | existing Funnemail reclassify Edge functions through compatibility adapter | COMPATIBILITY |

The browser generates a new `Idempotency-Key` for each intentional Draft Create, Send and Sync action and preserves that same request key across an authentication-refresh retry.

### Residual compatibility not in the primary simplified UI

- task PATCH/DELETE;
- draft action `send` (separate from normal compose/send and intentionally retained until dedicated idempotency is in place);
- diagnostic/self-test routes;
- legacy fallbacks retained for rollback until migration gates pass.

`Riclassifica` is the only currently visible operator action that still prefers a compatibility route. It must not be deleted; migrate it only by preserving the exact semantics of `funnemail-reclassify-now` / `funnemail-reclassify-batch` and proving conformance.

## Resilience

`modules/funnemail/serviceClient.js` is routed through the Nexus circuit breaker:

- opens after 3 consecutive boundary failures;
- resets/half-opens after 30 seconds;
- request timeout defaults to 12 seconds;
- runtime failure does not silently switch to a legacy database path.

This avoids cascading retries while keeping rollback explicit and controlled.

## CRM

Current CRM reads remain migration paths. Navigator/original datasets remain sources of truth while Nexus normalizes identity and prepares an independent store.

| Visible action | Nexus API | Current execution | Status |
|---|---|---|---|
| Search contacts | `GET /api/crm/contacts` | CRM service → Navigator read adapter → mapper/identity resolver | MIGRATION |
| Search companies/accounts | `GET /api/crm/accounts` | CRM migration/read-router model | MIGRATION |
| Pipeline/opportunities | `GET /api/crm/pipeline` | CRM aggregation over current migration sources | MIGRATION |
| Contact detail | `GET /api/crm/contact-detail` | CRM detail/read routing | MIGRATION |
| Contact activities | `GET /api/crm/activities` | CRM activities service | MIGRATION |

Do not modify Navigator original files to accelerate this migration.

## Aziende

| Visible action | Nexus API | Current execution | Status |
|---|---|---|---|
| Search companies | `GET /api/companies` | Nexus company-registry service | CANONICAL |

The simplified page remains read-oriented until ownership, authorization and business workflow for writes are explicit.

## Removal rule

A compatibility path may be removed only after all migration gates pass: contract compatibility, shadow/conformance, callers migrated, rollback ready and observability ready. Boundary-preferred routing by itself does not authorize deletion of legacy code.
