const EVIDENCE = new Map();

function key(capability, kind) { return `${capability}:${kind}`; }

function recordEvidence(input = {}) {
  if (!input.capability) throw new Error('EVIDENCE_CAPABILITY_REQUIRED');
  if (!input.kind) throw new Error('EVIDENCE_KIND_REQUIRED');
  const item = Object.freeze({
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
  EVIDENCE.set(key(item.capability, item.kind), item);
  return item;
}

function getEvidence(capability, kind) { return EVIDENCE.get(key(capability, kind)) || null; }
function listEvidence(capability) { return Array.from(EVIDENCE.values()).filter(item => !capability || item.capability === capability); }

module.exports = { recordEvidence, getEvidence, listEvidence };
