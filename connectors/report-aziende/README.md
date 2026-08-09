# Report Aziende Connector

Report Aziende is an external Italian company-data source, parallel to WCA App.

## Current status

Contract pending source review.

No endpoint, field mapping or licensing assumption is committed until the actual provider interface is inspected.

## Target role

Read-only source adapter for Italian company facts.

Candidate capabilities after source review:
- `company.search.italy.v1`
- `company.read.italy.v1`

## Explicit exclusions

Report Aziende is not CRM and does not own:
- relationship status;
- lead/pipeline state;
- interactions;
- tasks;
- email history;
- AI enrichment;
- Navigator workflow state.

## Migration rule

Do not copy provider data into GitHub. Preserve provenance and licensing constraints on every returned record.
