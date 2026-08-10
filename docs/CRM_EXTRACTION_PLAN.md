# CRM Extraction Plan — Read-Only First

Source reviewed in read-only mode: `tmwe-dev/wca-network-navigator`.

Observed CRM surface includes:
- V2 CRM page with Contacts / Pipeline / Duplicate tabs;
- lead score recalculation;
- AI Match;
- export;
- Deep Search / LinkedIn / Outreach handoff actions;
- AI tools for contact search/detail/status updates and Italian prospect search.

## Target independent CRM module

The future CRM service should own only commercial relationship state, not source-company facts.

### Core domains

**Accounts / Companies**
- CRM relationship shell linked to `identity.company.v1`;
- owner/assignment;
- commercial status;
- tags/segments;
- notes that are CRM-owned.

**Contacts**
- CRM relationship shell linked to `identity.contact.v1`;
- lead status;
- owner;
- communication preferences;
- CRM notes/tags.

**Pipeline / Opportunities**
- stages;
- probability/value/currency;
- next action;
- owner;
- close/lost reasons;
- company/contact identity links.

**Activities**
- tasks, calls, meetings, follow-ups and outreach references;
- references to Funnemail/BarTalk events rather than copies of message content.

## Initial Nexus contracts

```text
crm.company.search.v1
crm.company.read.v1
crm.contact.search.v1
crm.contact.read.v1
crm.contact.status.update.v1
crm.pipeline.search.v1
crm.opportunity.read.v1
crm.activity.search.v1
```

No write capability should be activated from Nexus until the standalone CRM ownership model is proven.

## What stays outside CRM

- WCA network master addresses/contacts → WCA App.
- Italian legal/company/report data → Report Aziende.
- web research → COBRA.
- mailbox/message state → Funnemail.
- live translated communication content → BarTalk.
- generic AI routing/memory → shared AI platform when extracted.

CRM consumes these capabilities; it does not duplicate their databases.

## Migration sequence

1. Inventory Navigator CRM callers, tables, Edge Functions, hooks and routes — read-only.
2. Map every legacy field to either CRM-owned state, Identity, or an external source.
3. Define read contracts in Nexus.
4. Build standalone CRM repository/service without changing Navigator.
5. Shadow-read: compare standalone CRM responses with Navigator CRM responses.
6. Migrate one consumer/capability at a time.
7. Only after parity: freeze/deprecate the equivalent Navigator CRM code.
8. Remove legacy code only when no active caller remains.

## Hard safety rule

During this phase there are **zero writes to Navigator**. Navigator is a reference implementation/data owner until the CRM service has been separated and validated.
