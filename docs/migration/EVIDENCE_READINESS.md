# Evidence-backed Migration Readiness

Nexus does not promote migration gates from assumptions.

## Sources of evidence

- Contract gate: stable declared Nexus contract.
- Shadow gate: accepted result recorded by the Navigator read-only vs Nexus shadow runner.
- Caller gate: non-empty verified caller inventory with zero active callers.
- Rollback gate: reversible consumer routing without source-data mutation.
- Observability gate: capability explicitly instrumented in Nexus telemetry.

## Safety rules

1. Missing evidence is a blocker, never a pass.
2. An empty caller inventory is not interpreted as zero callers.
3. A failed/skipped shadow run never promotes readiness.
4. Cutover remains impossible below 100/100.
5. Original repositories remain read-only and available for rollback.
6. Evidence collection must not mutate source datasets.

## Current persistence

The evidence registry is process-local behind a stable contract. It is sufficient for controlled shadow runs during extraction, but production cutover requires durable evidence persistence before any legacy capability is removed.
