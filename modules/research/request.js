function normalizeSources(value) {
  if (!value) return [];
  const items = Array.isArray(value) ? value : String(value).split(',');
  return [...new Set(items.map(v => String(v).trim()).filter(Boolean))];
}

function buildResearchRequest(input = {}) {
  const query = String(input.query || input.instruction || '').trim();
  if (!query) throw new Error('RESEARCH_QUERY_REQUIRED');

  const mode = ['simple', 'complex'].includes(input.mode) ? input.mode : 'simple';
  const depth = ['quick', 'standard', 'deep'].includes(input.depth) ? input.depth : 'standard';

  return {
    contract: 'research.request.v1',
    request_id: String(input.request_id || `research-${Date.now()}`),
    query,
    mode,
    depth,
    sources: normalizeSources(input.sources),
    entity_refs: Array.isArray(input.entity_refs) ? input.entity_refs : [],
    constraints: input.constraints && typeof input.constraints === 'object' ? input.constraints : {},
    requested_by: input.requested_by || 'nexus',
    orchestration_owner: 'cobra'
  };
}

module.exports = { buildResearchRequest, normalizeSources };
