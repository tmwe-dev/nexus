# Nexus Identity Layer

## Goal

Allow WCA App, Report Aziende, CRM, COBRA research, Funnemail and later Navigator/TMWE2 to refer to the same company or person without merging their databases.

## Core rule

Nexus identity is a federation index, not a source of business facts.

It owns only:
- a stable Nexus `entity_id`;
- links to source records (`source_refs`);
- normalization keys used for matching;
- match confidence/status;
- conflict/provenance metadata.

It does **not** own WCA addresses, Report Aziende financial/company facts, CRM relationship state, email messages or COBRA research findings.

## Source reference

Every linked record is represented as:

```json
{
  "source": "wca|report-aziende|crm|funnemail|cobra|bartalk|navigator",
  "source_id": "original-id",
  "record_type": "company|contact",
  "observed_at": "ISO-8601",
  "attributes": {}
}
```

`attributes` is limited to matching/provenance metadata and is not a copy of the source database.

## Company matching order

1. Exact stable legal identifier when available (VAT/tax/company number + jurisdiction).
2. Exact normalized domain/website when trustworthy.
3. Exact normalized company name + country + city/address evidence.
4. Probabilistic name/address/domain match.
5. Unresolved/conflict: keep separate and require review.

Never auto-merge merely because two companies have a similar name.

## Contact matching order

1. Exact normalized email address.
2. Exact normalized phone + compatible company.
3. Strong name + company + role evidence.
4. Otherwise unresolved.

## Conflicts

If WCA says one address and Report Aziende/Cobra says another, Identity does not choose a winner silently. It links both facts to their source and exposes the conflict to the consumer.

## Architecture

```text
WCA -----------\
Report Aziende --\
CRM --------------> Nexus Identity Index ---> consumers
COBRA Research ---/
Funnemail --------/
```

The index contains identifiers and links, not full source records.

## Safety during migration

Phase 6 is additive. Navigator remains unchanged and operational. CRM extraction starts as a read-only mapping exercise; no legacy table, Edge Function, route or UI is removed until a standalone CRM service has proven equivalent contracts and callers have migrated.
