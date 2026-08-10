# Capability Migration Portfolio

Nexus tracks migration readiness per capability, not per application.

Current extracted capabilities are intentionally conservative: a replacement being present does not imply migration completion.

## Rules

- Contract compatibility is credited only where a stable Nexus contract exists.
- Shadow/conformance remains false until real reference-vs-candidate comparison is accepted.
- Caller migration remains false until active consumers stop depending on the legacy path.
- Rollback is true only where consumer routing can return to the legacy source without source-data mutation.
- Observability is true only where the capability participates in the Nexus telemetry layer.
- No capability is removable below 100/100.

## Current focus

CRM contacts, accounts, pipeline, activities, opportunities, sales priorities, marketing planning and research execution are tracked individually.

Original applications remain unchanged and available as migration sources until their individual capabilities pass all gates.
