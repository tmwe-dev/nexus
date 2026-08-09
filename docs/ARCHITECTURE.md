# TMWE Nexus Architecture

## Purpose
Nexus connects independent applications and data sources through stable, versioned capabilities.

## Laws
1. Applications remain independently operable.
2. Each capability has one primary owner.
3. Each datum has one authoritative source.
4. Services do not read another service's private database directly.
5. Cross-service calls use public, versioned contracts.
6. Cobra orchestrates workflows; it does not absorb domain business logic.
7. Navigator consumes capabilities and presents intelligence.
8. Failures degrade gracefully when dependencies are optional or enhancing.
9. Side-effecting commands are idempotent.
10. No production data or secrets are committed to GitHub.
11. No big-bang migration.
12. TMWE2 is integrated last and remains untouched during the current program.

## Initial topology

Navigator / Cobra / CRM / Funnemail / BarTalk
        |
        v
     Nexus APIs
        |
        +--> WCA App
        +--> Report Aziende
        +--> Scraper / Research
        +--> AI Platform

## First migration
The first production boundary is WCA read access.

WCA App remains source of truth for network forwarder records, commercial contacts and business cards. Nexus exposes only the read capabilities needed by consumers.
