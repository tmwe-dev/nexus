function config() {
  const baseUrl = process.env.NEXUS_CONTROL_PLANE_URL;
  const apiKey = process.env.NEXUS_CONTROL_PLANE_KEY;
  return baseUrl && apiKey ? { baseUrl: baseUrl.replace(/\/$/, ''), apiKey } : null;
}

function headers(apiKey) {
  return {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal'
  };
}

async function persistEvidence(item) {
  const cfg = config();
  if (!cfg) return { durable: false, reason: 'control_plane_not_configured' };
  const row = {
    capability: item.capability,
    kind: item.kind,
    accepted: item.accepted,
    source: item.source,
    basis: item.basis,
    sample_size: item.sample_size,
    observed_at: item.observed_at,
    metadata: item.metadata || null
  };
  const response = await fetch(`${cfg.baseUrl}/rest/v1/migration_evidence?on_conflict=capability,kind`, {
    method: 'POST',
    headers: headers(cfg.apiKey),
    body: JSON.stringify(row)
  });
  if (!response.ok) throw new Error(`EVIDENCE_PERSIST_FAILED_${response.status}`);
  return { durable: true };
}

async function loadEvidence(capability = null) {
  const cfg = config();
  if (!cfg) return { durable: false, items: [], reason: 'control_plane_not_configured' };
  const params = new URLSearchParams();
  params.set('select', 'capability,kind,accepted,source,basis,sample_size,observed_at,metadata');
  if (capability) params.set('capability', `eq.${capability}`);
  const response = await fetch(`${cfg.baseUrl}/rest/v1/migration_evidence?${params.toString()}`, { headers: headers(cfg.apiKey) });
  if (!response.ok) throw new Error(`EVIDENCE_LOAD_FAILED_${response.status}`);
  const items = await response.json();
  return { durable: true, items: Array.isArray(items) ? items : [] };
}

module.exports = { persistEvidence, loadEvidence, config };
