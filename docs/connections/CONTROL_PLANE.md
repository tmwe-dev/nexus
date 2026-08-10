# Connections Control Plane

Every external source or application remains independently connectable.

The Connections page/API must show, per service:
- identity and ownership;
- source-of-truth status;
- read/write/session/orchestration mode;
- endpoint configured or not;
- token configured or not;
- declared capabilities;
- required Nexus auth scopes;
- circuit-breaker state and operational status;
- whether the integration is deferred.

## Current boundaries

- WCA App: source of WCA partner addresses, contacts and business cards; read-only from Nexus.
- Report Aziende: deferred placeholder only until the main system is complete.
- COBRA: complex research/browser/workflow orchestration; Nexus does not duplicate its scraper.
- Funnemail: email domain/application boundary.
- BarTalk: communication/session boundary; Nexus does not store message content.
- CRM: standalone Nexus CRM under extraction; legacy Navigator remains read-only migration source.
- TMWE2: explicitly excluded until the final integration phase.

No connection state grants permission to mutate an original source system.
