const { getSalesPriorities } = require('../../sales-intelligence/service');

async function buildAudience(filters = {}) {
  const payload = await getSalesPriorities(filters);
  const minScore = Number(filters.min_score) || 0;
  const allowedStages = filters.stages ? new Set(String(filters.stages).split(',').map(s => s.trim()).filter(Boolean)) : null;
  const items = (payload.items || []).filter(item => {
    if ((item.score || 0) < minScore) return false;
    if (allowedStages && !allowedStages.has(item.lead_status)) return false;
    return !['archived','blacklisted'].includes(item.lead_status);
  });
  return {
    contract: 'marketing.audience.v1',
    source_mode: payload.source_mode,
    partial: Boolean(payload.partial),
    items,
    rules: ['Audience selection is read-only.', 'Archived and blacklisted records are excluded.', 'Audience membership never changes CRM state.']
  };
}

module.exports = { buildAudience };
