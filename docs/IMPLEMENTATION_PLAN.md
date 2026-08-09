# Implementation Plan

## Phase 1 — WCA boundary
1. Keep WCA App as authoritative source.
2. Expose read-only Nexus contracts.
3. Shadow-compare Nexus WCA results with current Navigator reads.
4. Move one Navigator caller at a time.
5. Deprecate legacy access only after zero direct callers.

## Phase 2 — Additional data sources
- Report Aziende
- Scraper / Research

## Phase 3 — Independent applications
- Funnemail
- BarTalk
- CRM extraction
- AI Platform / Agent Framework

## Phase 4 — Cobra orchestration
Cobra discovers and composes capabilities without taking domain ownership.

## Phase 5 — Navigator reduction
Remove duplicated implementation only after the target capability is proven.

## Phase 6 — TMWE2
TMWE2 is connected last through Nexus contracts and is not modified during earlier phases.
