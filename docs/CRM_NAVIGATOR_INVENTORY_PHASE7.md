# Phase 7 — Navigator CRM Inventory (read-only source review)

Source repository reviewed in read-only mode: `tmwe-dev/wca-network-navigator`.

No source application is modified by this phase. All new material lives only in `tmwe-dev/nexus`.

## 1. Current CRM surfaces

### Main CRM page

`src/v2/ui/pages/CRMPage.tsx`

Current tabs and actions:
- Contacts;
- Pipeline / Kanban;
- Duplicate detection;
- Lead-score recalculation;
- Export;
- AI Match;
- Deep Search handoff;
- LinkedIn lookup handoff;
- Outreach Cockpit handoff.

### Contacts page

`src/v2/ui/pages/ContactsPage.tsx`

Current behaviour:
- list + detail layout;
- contact/company search and sorting;
- detail load by contact ID;
- bulk add to Outreach Cockpit;
- bulk campaign creation;
- bulk origin change;
- distinct-origin filters;
- pagination/infinite loading;
- telemetry on entity open.

Important architectural observation: the CRM UI often presents imported contacts grouped or projected as companies. The standalone CRM must separate **company/account identity** from **person/contact identity** instead of preserving this ambiguity.

## 2. Primary persisted contact model

The central current table is `imported_contacts`.

Observed fields used by the DAL include:

### Identity / source fields
- `id`
- `user_id`
- `external_id`
- `import_log_id`
- `row_number`
- `origin`
- `raw_data`
- `created_at`

### Company/contact factual fields
- `company_name`
- `company_alias`
- `name`
- `contact_alias`
- `position`
- `email`
- `email_status`
- `phone`
- `mobile`
- `address`
- `city`
- `zip_code`
- `country`

### CRM-owned relationship fields
- `lead_status`
- `status_reason`
- `operator_id`
- `note`
- `interaction_count`
- `last_interaction_at`
- `converted_at`
- `is_selected`

### Enrichment / federation fields
- `deep_search_at`
- `enrichment_data`
- `wca_partner_id`
- `wca_match_confidence`

### Transfer / lifecycle fields
- `is_transferred`
- `transferred_to_partner_id`
- `transferred_at`

### Scoring fields
- `lead_score`
- `lead_score_breakdown`
- `lead_score_updated_at`

The current table therefore mixes at least five concerns: imported source facts, identity, CRM relationship state, enrichment, and scoring. The independent CRM must not reproduce this mixed table unchanged.

## 3. Lead lifecycle

Current `LeadStatus` values:

```text
new
first_touch_sent
holding
engaged
qualified
negotiation
converted
archived
blacklisted
```

The current Kanban exposes the active commercial path:

```text
new
→ first_touch_sent
→ holding
→ engaged
→ qualified
→ negotiation
→ converted
```

`archived` and `blacklisted` are valid domain states but are not normal Kanban columns.

The current drag-and-drop pipeline changes `lead_status` on `imported_contacts`.

### Target ownership

This lifecycle belongs to the future independent CRM, not WCA, Report Aziende, COBRA, Funnemail or Nexus Identity.

## 4. Interaction model

The source defines `contact_interactions` with at least:
- `id`
- `contact_id`
- `interaction_type`
- `title`
- `description`
- `outcome`
- `created_at`
- `created_by`

Interaction data is also consumed by lead scoring.

Target design:
- CRM owns commercial activity metadata;
- Funnemail remains owner of email bodies/mailbox state;
- BarTalk remains owner of translated/live communication content;
- CRM stores references/events such as `email_sent`, `email_reply`, `meeting`, not duplicated communication content.

## 5. Lead scoring

Current Edge Function: `calculate-lead-scores`.

Observed scoring signals:
- email present: +15;
- phone/mobile present: +10;
- more than five interactions: +15;
- sent email plus reply/received email: +25;
- meeting interaction: +20;
- matched business card: +10;
- last interaction <7 days: +15;
- <30 days: +10;
- <90 days: +5;
- negotiation/converted status: +20;
- origin containing personal-meeting signal: +15;
- total capped at 100.

The current implementation reads `imported_contacts`, `contact_interactions` and `business_cards`, then persists score/breakdown on `imported_contacts`.

### Target decision

Lead scoring is a CRM/Sales Intelligence capability. The algorithm should be extracted as a versioned policy rather than buried in a general contact table.

Target contracts:

```text
sales.lead-score.calculate.v1
sales.lead-score.read.v1
```

The policy version must be returned with each score so future changes do not silently reinterpret historical values.

## 6. Duplicate detection

Current UI scans up to 1,000 contacts and groups duplicates by:
1. normalized exact email;
2. normalized phone/mobile (minimum 8 digits);
3. exact normalized company name.

Merge is delegated to `deduplicate-contacts` through the AI invocation layer.

### Target decision

Duplicate detection crosses CRM and Identity responsibilities:
- **Nexus Identity** owns cross-source entity resolution/match confidence;
- **CRM** owns duplicate CRM relationship records;
- CRM must never merge two source companies merely because names match;
- destructive merge becomes a separate guarded capability, not part of ordinary reads.

Target capabilities:

```text
crm.duplicate.scan.v1
crm.duplicate.merge.preview.v1
crm.duplicate.merge.execute.v1   # future guarded write
```

## 7. Existing AI/tool surface

Observed CRM AI tool definitions:
- `search_contacts`;
- `get_contact_detail`;
- `update_lead_status`;
- `search_prospects`.

These must not be copied as opaque AI tools. They should become stable service capabilities that AI, Navigator or COBRA may call.

Target mapping:

```text
search_contacts       -> crm.contact.search.v1
get_contact_detail    -> crm.contact.read.v1
update_lead_status    -> crm.contact.status.update.v1
search_prospects      -> source/company discovery capability, not automatically CRM-owned
```

`search_prospects` needs special handling because Italian company facts may belong to Report Aziende rather than CRM.

## 8. Source ownership disposition

| Current information | Future owner | Rule |
|---|---|---|
| company/contact source IDs | original source + Nexus Identity ref | never replace original IDs |
| WCA member/company facts | WCA App | CRM links, does not copy master facts |
| Italian company/legal facts | Report Aziende | CRM links via identity |
| web research facts | COBRA/evidence source | CRM may reference accepted findings |
| person/company federation | Nexus Identity | source refs + confidence only |
| lead status | CRM | CRM-owned |
| operator/owner | CRM | CRM-owned |
| CRM notes/tags | CRM | CRM-owned |
| pipeline/opportunities | CRM | CRM-owned |
| interaction metadata | CRM | no message-body duplication |
| mailbox/message content | Funnemail | reference only |
| live translated content | BarTalk | reference/session metadata only |
| lead score | CRM / Sales Intelligence | versioned policy |
| business card source record | WCA/data-source domain | CRM consumes match/reference |
| enrichment payload | source-specific | do not keep generic unbounded blob as CRM truth |

## 9. Code families found in Navigator

Relevant current families include:

```text
src/v2/ui/pages/CRMPage.tsx
src/v2/ui/pages/ContactsPage.tsx
src/components/contacts/ContactPipelineView.tsx
src/components/contacts/DuplicateDetector.tsx
src/data/contacts/*
src/data/contactRecord.ts
src/data/contactMergeQueries.ts
src/data/importedContactsV2.ts
supabase/functions/_shared/platformToolDefs/crmTools.ts
supabase/functions/ai-assistant/toolExecutors/crm.ts
supabase/functions/calculate-lead-scores/*
```

There are also integrations with Deep Search, LinkedIn, Outreach/Campaign, import logs, business cards, WCA matching and Agenda/interactions. These dependencies are why we must extract by capability rather than copy the whole CRM directory.

## 10. Extraction order

Recommended safe order:

1. Define standalone CRM domain model in Nexus contracts.
2. Separate Company/Account from Contact/Person explicitly.
3. Implement read-only adapters against current Navigator CRM data.
4. Implement lead-status/pipeline read model.
5. Implement interaction/activity read model.
6. Implement versioned lead-score policy.
7. Implement duplicate preview using Nexus Identity signals.
8. Build independent CRM application/service in a new repository.
9. Shadow-read against Navigator.
10. Only after parity, migrate one caller at a time.
11. Writes remain disabled until read parity and ownership are proven.
12. Navigator legacy code is deprecated only after zero active callers remain.

## Hard safety rule

Phase 7 performs **zero writes to Navigator and zero writes to its database**. Nothing is deprecated or removed from any original program in this phase.
