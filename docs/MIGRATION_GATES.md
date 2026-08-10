# Migration Gates & Deprecation Policy

A legacy capability is never removed merely because a Nexus replacement exists.

## Mandatory gates

A capability can be deprecated only when all five gates are true:

1. contract compatible;
2. shadow comparison acceptable;
3. active callers migrated;
4. rollback ready;
5. observability ready.

## Readiness score

The score is 0–100 with weighted gates:
- contract compatibility: 25;
- shadow/conformance: 25;
- caller migration: 20;
- rollback: 15;
- observability: 15.

Only 100/100 means `ready_to_deprecate=true`.

## Rollback

Rollback must restore consumer routing without requiring source-data mutation. Original applications remain untouched until replacement confidence is complete.

## Deprecation registry

Deprecation entries track source, replacement, active caller count, rollback availability and planned removal date. Removal occurs only after caller count reaches zero and the readiness gates remain satisfied.

## Safety

This policy applies to Navigator and every other migration source. It does not authorize changes to original repositories.
