# Nexus Home Update Policy

Every completed development phase must update the Nexus Home/System Map in the same phase.

Required synchronization points:
- newly built modules and capabilities;
- green/grey status;
- counters and implementation percentage;
- runtime readiness;
- connector status and conformance;
- release gate and blockers;
- deployment sync and deployed/expected SHA;
- production cutover state.

A phase is not considered complete until the Home/System Map accurately reflects its delivered state.

This policy applies only to `tmwe-dev/nexus`; original applications remain read-only and untouched during extraction/migration.
