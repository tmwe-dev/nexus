# Usage, Cost & Observability

## Goal

Every metered or external Nexus capability can be traced by correlation id and can report latency, usage and attributable cost without coupling business modules to provider-specific logic.

## Required metadata

- correlation_id
- service
- capability
- status
- latency_ms
- provider/model when applicable
- input/output units when available
- external call count
- explicit cost amount and currency when known

## Boundaries

The ledger stores operational metadata only. It must not store email bodies, research payloads, CRM records, WCA records, BarTalk content or other source datasets.

## Cost rule

Do not fabricate cost estimates. If a provider does not expose usage or a price table has not been configured, record the known usage and leave attributable cost at zero/unknown until pricing is explicitly configured.

## Failure rule

Observability is non-blocking. A ledger failure must never make CRM, Research, COBRA, Funnemail, WCA or AI execution fail.

## Persistence

The first implementation is intentionally memory-only. A production persistence adapter will be added later behind the same contract; business modules must not depend on the storage technology.

## Source safety

Only Nexus is modified. Original applications remain untouched/read-only during extraction and integration.
