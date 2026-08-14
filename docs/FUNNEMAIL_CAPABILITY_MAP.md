# Funnemail Capability Map

`RULES.md` is authoritative.

Original/source repository: `tmwe-dev/funnemail` — **read-only** unless the owner explicitly orders a change to that original.

Canonical Nexus-owned integration source: `services/funnemail-boundary/index.ts`.

## Proven source behavior

Source review confirms a Supabase-backed mail application with message state, drafts, mailbox configuration, IMAP sync, sending, email-domain AI, rules, tasks and sender intelligence.

Relevant existing Funnemail Edge functions include:

- `funnemail-send-direct`
- `funnemail-compose`
- `funnemail-classify`
- `funnemail-imap-sync`
- `funnemail-imap-move`
- `funnemail-imap-mark-seen`
- `funnemail-imap-mark-flag`
- `funnemail-apply-rules`
- `funnemail-enrich-inbox`
- `funnemail-reclassify-now`
- `funnemail-reclassify-batch`

These original functions remain unchanged. The Nexus-owned boundary delegates to them where that is the safest way to preserve source semantics.

## Deployed Nexus boundary

- Function: `funnemail-nexus-v1`
- Supabase project: `rxocvyfhsqduowltmfbp`
- Current verified deployment: version `6`, status `ACTIVE`
- Auth: delegated Funnemail user JWT validated by the boundary
- `verify_jwt=false` is intentional because the function performs explicit auth validation itself

## Boundary-preferred Nexus capabilities

### Authentication

- `funnemail.auth.login.v1`
- `funnemail.auth.refresh.v1`
- `funnemail.auth.user.v1`

### Mail core

- `email.message.search.v1`
- `email.message.read.v1`
- `email.dashboard.v1`
- `email.message.status.v1`
- `email.draft.list.v1`
- `email.draft.create.v1`
- `email.draft.action.v2` for safe actions
- `email.send.v1`
- `email.sync.v1`
- `email.classify.v1`

### Secondary Mail functions

- `email.tasks.v2`
- `email.task.create.v2`
- `email.senders.v1`
- `email.rules.v1`
- `email.rules.apply.v1`
- `email.compose.v2`
- `email.sender-intel.v1`
- `email.enrich.v1`

## Residual compatibility

The simplified UI still has one visible action that prefers compatibility routing:

- `email.reclassify.v1` → existing `funnemail-reclassify-now` / `funnemail-reclassify-batch`.

Additional compatibility remains outside the primary simplified UI for task PATCH/DELETE, draft-action send, diagnostics and rollback fallbacks.

Do not remove any of these until migration gates pass.

## Ownership

Funnemail remains owner of:

- mailbox/message state;
- email drafts;
- mailbox sync;
- sending;
- email-specific classification/reclassification;
- email rules;
- email tasks where they are derived from mailbox workflow;
- sender intelligence specific to mail.

Nexus owns the stable integration boundary, routing contracts, orchestration policy and migration controls. Nexus does **not** become the mailbox database.

## Target configuration

`registry/connections.js` defines the public non-secret boundary URL once as `targetDefaultBase`. `FUNNEMAIL_BASE_URL` is only an optional override.

Direct Supabase compatibility configuration is rollback-only, not the preferred operator route.

## Current migration rule

Boundary-preferred routing does not mean the legacy path may be deleted. Each capability still requires contract conformance, runtime evidence, caller migration, rollback and observability before deprecation reaches 100/100.
