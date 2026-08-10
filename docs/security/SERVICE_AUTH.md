# Service-to-Service Authentication

Nexus uses bearer tokens only at runtime. Raw tokens are never stored in the repository.

## Modes

- `off`: local emergency/development only.
- `audit`: extraction and integration phase; invalid/missing tokens are observed but do not block.
- `enforce`: required before production cutover.

## Runtime registry

`NEXUS_SERVICE_TOKEN_REGISTRY` contains service identities, SHA-256 token digests and scopes. Raw tokens must be distributed outside GitHub and outside Nexus source control.

Example logical shape (values omitted):

```json
{
  "cobra": { "token_sha256": "...", "scopes": ["research:execute"] },
  "funnemail": { "token_sha256": "...", "scopes": ["email:read", "email:send"] }
}
```

## Rules

- compare digests using constant-time comparison;
- least-privilege scopes;
- no shared universal token except temporary emergency rotation;
- token rotation does not change capability contracts;
- `enforce` is mandatory before any legacy cutover;
- original applications are not modified by this policy.
