# Event Schemas Registry

## Goal

Modules remain independent. Events are contracts between them, not hidden coupling.

## Naming

Use `<domain>.<fact>.v<major>`.

Examples:
- `crm.contact.updated.v1`
- `crm.account.stage.changed.v1`
- `marketing.campaign.planned.v1`
- `research.completed.v1`
- `email.received.v1`

## Versioning

- Adding optional fields is backward-compatible inside the same major version.
- Removing or renaming fields is breaking and requires a new major version.
- Changing field meaning is breaking and requires a new major version.
- Consumers declare which major versions they accept.
- Old versions are deprecated only after all active consumers have migrated.

## Envelope

Every event uses `event.envelope.v1` with event id, event type, producer, timestamp, payload and optional subject/correlation/causation references.

## Boundaries

Events contain the minimum references required for downstream work. They do not copy complete source records or transfer ownership of operational data.

## Initial catalog

The first catalog covers CRM changes, campaign planning, research completion and inbound email. This is a registry only: no message broker or automatic source mutation is introduced in this phase.

## Safety

Only Nexus is modified. Original applications remain read-only during extraction and integration.
