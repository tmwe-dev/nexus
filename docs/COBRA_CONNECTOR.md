# COBRA Connector

Repository reviewed: `tmwe-dev/COBRA`.

## Proven source boundary

COBRA's current modular server exposes authenticated `/api/*` routes. The router enforces `X-Cobra-Token` for normal API access, and `/api/chat` is the proven orchestration entrypoint.

Nexus currently adds a compatibility adapter:

- `GET /api/cobra/health` → COBRA `/api/status`
- `POST /api/cobra/workflow` → COBRA `/api/chat`

## Important limitation

`/api/chat` is synchronous and COBRA itself allows long turns. That is appropriate for the local operator application but not ideal as the final server-to-server workflow protocol on Vercel.

Therefore `api/cobra/workflow.js` is a migration bridge, not the final design.

## Required next evolution in COBRA

Add a narrow service API without changing the existing UI flow:

```text
GET  /api/nexus/v1/health
POST /api/nexus/v1/workflows
GET  /api/nexus/v1/workflows/:requestId
POST /api/nexus/v1/research
```

Long-running work should become asynchronous and return `accepted` plus a request/job identifier. Existing risk checks, confirmations, audit chain and browser guards must remain inside COBRA.

## Security

Nexus never receives COBRA's model-provider secrets. It only uses a scoped service token. COBRA remains responsible for action risk and irreversible-action confirmation.
