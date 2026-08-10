const { persistEvidence, loadEvidence } = require('./evidenceStore');

const EVIDENCE = new Map();

function key(capability, kind) { return `${capability}:${kind}`; }

function normalize(input = {}) {
  if (!input.capability) throw new Error('EVIDENCE_CAPABILITY_REQUIRED');
  if (!input.kind) throw new Error('EVIDENCE_KIND_REQUIRED');
  return Object.freeze({
    contract: 'migration.evidence.v1',
    capability: input.capability,
    kind: input.kind,
    accepted: input.accepted === true,
    source: input.source || 'nexus',
    basis: input.basis || null,
    sample_size: Number(input.sample_size || 0),
    observed_at: input.observed_at || new Date().toISOString(),
    metadata: input.metadata || null
  });
}

function recordEvidence(input = {}) {
  const item = normalize(input);
  EVIDENCE.set(key(item.capability, item.kind), item);
  persistEvidence(item).catch(() => {});
  return item;
}

async function hydrateEvidence(capability = null) {
  const loaded = await loadEvidence(capability);
  for (const raw of loaded.items || []) {
    const item = normalize(raw);
    const current = EVIDENCE.get(key(item.capability, item.kind));
    if (!current || String(item.observed_at) >= String(current.observed_at)) EVIDENCE.set(key(item.capability, item.kind), item);
  }
  return { durable: loaded.durable, loaded: loaded.items?.length || 0, reason: loaded.reason || null };
}

function getEvidence(capability, kind) { return EVIDENCE.get(key(capability, kind)) || null; }
function listEvidence(capability) { return Array.from(EVIDENCE.values()).filter(item => !capability || item.capability === capability); }

module.exports = { recordEvidence, hydrateEvidence, getEvidence, listEvidence };
