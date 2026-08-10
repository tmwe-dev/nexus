# Vercel production runtime

Nexus production runtime must keep secrets outside the repository.

## Required environment variables

- `NEXUS_CRM_STORE_URL` — REST base URL of the isolated Nexus CRM datastore.
- `NEXUS_CRM_STORE_TOKEN` — server-side token for the Nexus CRM datastore.
- `NEXUS_AUTH_MODE=enforce` — production service-to-service authentication mode.
- `NEXUS_SERVICE_TOKEN_REGISTRY` — JSON registry containing only SHA-256 token digests and scopes.

## Safe defaults

If the CRM datastore is not configured, Nexus falls back to memory-only storage for development and the production readiness endpoint remains false.

If service authentication is not set to `enforce`, production readiness remains false.

The endpoint `/api/operations/runtime-readiness` exposes only configuration state and reachability. It never returns tokens or secrets.

A green runtime readiness result does not authorize legacy cutover by itself. Migration evidence and rollback gates remain mandatory.
