const DEPRECATIONS = new Map();

function registerDeprecation(entry = {}) {
  if (!entry.capability) throw new Error('DEPRECATION_CAPABILITY_REQUIRED');
  const normalized = Object.freeze({
    contract: 'deprecation.entry.v1',
    capability: entry.capability,
    source: entry.source || 'legacy',
    replacement: entry.replacement || null,
    status: entry.status || 'planned',
    deprecated_at: entry.deprecated_at || null,
    remove_after: entry.remove_after || null,
    active_callers: Number(entry.active_callers || 0),
    rollback_available: entry.rollback_available !== false,
    notes: entry.notes || null
  });
  DEPRECATIONS.set(entry.capability, normalized);
  return normalized;
}

function listDeprecations() { return Array.from(DEPRECATIONS.values()); }
function getDeprecation(capability) { return DEPRECATIONS.get(capability) || null; }

module.exports = { registerDeprecation, listDeprecations, getDeprecation };
