# Durable Migration Evidence

Nexus migration evidence is control-plane metadata, not business data.

## Runtime behavior

- In-memory evidence remains the fast local cache.
- When `NEXUS_CONTROL_PLANE_URL` and `NEXUS_CONTROL_PLANE_KEY` are configured, evidence is persisted to the independent `migration_evidence` table.
- Readiness, portfolio and cutover APIs hydrate durable evidence before evaluation.
- Failure to hydrate does not break normal Nexus business capabilities.
- Production legacy cutover is blocked when the durable evidence store is not configured.

## Data boundary

The durable store contains only capability, evidence kind, acceptance flag, source, basis, sample size, timestamp and operational metadata. It must never contain WCA records, CRM payloads, emails, BarTalk content or source-system datasets.

## Original applications

Navigator, WCA App, COBRA, Funnemail, BarTalk and TMWE2 remain read-only migration sources and are not changed by this mechanism.
