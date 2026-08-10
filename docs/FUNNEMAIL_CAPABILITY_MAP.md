# Funnemail Capability Map

Repository reviewed: `tmwe-dev/funnemail`.

## Proven current implementation

The source review confirms a Supabase-backed mail application with active message state, drafts, mailbox configuration, IMAP sync and email-domain AI. The current control map identifies active Edge functions including:

- `funnemail-send-direct`
- `funnemail-compose`
- `funnemail-classify`
- `funnemail-imap-sync`
- `funnemail-imap-move`
- `funnemail-imap-flags-sync`
- `funnemail-imap-mark-seen`
- `funnemail-imap-mark-flag`
- `funnemail-generate-drafts`

## Nexus target capabilities

```text
email.message.search.v1
email.message.read.v1
email.draft.create.v1
email.send.v1
email.sync.v1
email.classify.v1
```

These names are Nexus contracts, not aliases for direct database access.

## Ownership

Funnemail remains owner of:
- mailbox/message state;
- email drafts;
- mailbox sync;
- email sending;
- email-specific classification/rules.

Nexus does not become the mailbox database.

## Extraction boundary

Generic model routing, shared agent infrastructure, generic memory and cost/usage tracking should not be copied out blindly. They move to shared services only after every Funnemail caller has been mapped and a stable replacement contract exists.

## Next implementation step

Create a narrow Funnemail service boundary around proven functions, preferably under `/api/nexus/v1/*` or equivalent Supabase Edge endpoints, then place Nexus adapters in front of those endpoints. Do not expose the full Supabase schema to Nexus consumers.
