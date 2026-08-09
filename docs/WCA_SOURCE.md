# WCA Source Boundary

WCA App is a data source only.

## Owns
- network forwarder/company records;
- addresses and company contact channels;
- commercial contacts embedded in WCA profiles;
- business-card source records.

## Does not own
- CRM lead/pipeline state;
- favorites;
- interactions or reminders;
- email history;
- campaigns;
- research or AI enrichment;
- Navigator workflow state.

## Current measured source
- `wca_profiles`
- `wca_business_cards`

## Nexus rule
Consumers use Nexus read contracts. They do not couple to WCA App internals or database credentials.
