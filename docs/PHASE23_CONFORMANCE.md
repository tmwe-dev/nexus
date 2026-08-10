# Phase 23 — Contract, Capability & Conformance Layer

This phase keeps all original applications read-only and changes only `tmwe-dev/nexus`.

## Five workstreams

1. Contract validation — minimal deterministic validation for required fields and primitive shapes.
2. Capability enforcement — a service may expose only capabilities declared in the Nexus connection registry.
3. Shadow/conformance — compare legacy/reference output with Nexus output while ignoring volatile metadata.
4. Operational dashboard — aggregate connection state, resilience and usage metadata without copying business payloads.
5. Deploy preflight — distinguish blocking runtime requirements from optional integrations that must degrade gracefully.

## Migration rule

A legacy capability is not deprecated because a replacement exists. It is deprecated only when the Nexus capability is contract-compatible, shadow comparison is acceptable, active callers have migrated and rollback remains possible.

## Safety

No original repository is modified. No source datasets are copied. No automatic source mutations are introduced.