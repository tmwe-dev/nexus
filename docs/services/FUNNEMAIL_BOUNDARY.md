# Funnemail Application Boundary

Repository: `tmwe-dev/funnemail`.

## Source reviewed

The current architecture contains:
- inbox and mail reader UI;
- Supabase-backed email message/state storage;
- drafts and tasks;
- mailbox configuration;
- AI classification, prompts, rules, KB and memory;
- dashboards and settings;
- Edge Functions and realtime subscriptions.

## Nexus ownership rule

Funnemail remains an independent application. Nexus does not copy its mailbox database or UI implementation.

The future integration boundary should expose only stable capabilities such as:
- mailbox/message read;
- message search;
- draft create/update;
- send command;
- task read/write if task ownership remains in Funnemail;
- AI classification only if it remains Funnemail-specific.

## Extraction rule

Generic AI platform capabilities must eventually be separated from Funnemail-specific email intelligence. Funnemail keeps email-domain logic; shared model routing, generic memory, cost tracking and agent infrastructure move to shared services only after callers are mapped.

## No big-bang rewrite

Existing Funnemail remains operational while Nexus contracts are introduced around proven functionality.
