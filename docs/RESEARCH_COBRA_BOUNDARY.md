# Research Engine / COBRA Boundary

## Rule

Nexus does not implement a second scraper.

The Research Engine normalizes requests and results. COBRA executes browser automation, web research and complex multi-step external work.

## Ownership

- CRM owns commercial state.
- Nexus Identity owns federated references and matching evidence.
- Sales Intelligence owns advisory ranking.
- AI Platform owns provider-neutral model access.
- Agent Framework owns bounded tool plans.
- Research Engine owns research request/result contracts.
- COBRA owns browser automation and complex research orchestration.

## Graceful degradation

If COBRA is unavailable, callers continue with available CRM, WCA and Identity information. Research is enrichment, not a hard dependency.

## Current compatibility adapter

COBRA currently exposes `/api/chat` as a proven serverless entry point. Nexus therefore translates `research.request.v1` into a structured instruction sent to that endpoint. A dedicated COBRA research API can replace this adapter later without changing consumers of Nexus.

## Safety

No source application is modified by this phase. Research execution is instructed not to mutate external systems.
