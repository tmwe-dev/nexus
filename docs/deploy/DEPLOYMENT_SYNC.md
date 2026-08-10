# Deployment synchronization

GitHub `tmwe-dev/nexus:main` is the canonical source of truth.

The production deployment must expose `/api/operations/deployment-sync` and Vercel's `VERCEL_GIT_COMMIT_SHA` / `VERCEL_GIT_COMMIT_REF` metadata.

Set `NEXUS_EXPECTED_RELEASE_SHA` to the approved `main` release SHA when promoting a release. `in_sync=true` is allowed only when the deployed commit matches that expected SHA prefix.

A deployment that is reachable but reports `in_sync=false` must not be treated as current production.

This mechanism does not alter Navigator, WCA App, COBRA, Funnemail, BarTalk or TMWE2.
