const { CAPABILITY_MIGRATIONS } = require('./capabilityMap');
const { evidenceReadiness } = require('./evidenceReadiness');

function migrationPortfolio() {
  const items = CAPABILITY_MIGRATIONS.map(item => ({ ...item, evidence_readiness: evidenceReadiness(item.capability) }));
  const scored = items.filter(item => item.evidence_readiness?.found);
  const total = scored.length;
  const score = total ? Math.round(scored.reduce((sum, item) => sum + item.evidence_readiness.readiness.score, 0) / total) : 0;
  const ready = scored.filter(item => item.evidence_readiness.readiness.ready_to_deprecate).length;
  const byGrade = scored.reduce((acc, item) => {
    const grade = item.evidence_readiness.readiness.grade;
    acc[grade] = (acc[grade] || 0) + 1;
    return acc;
  }, {});
  return {
    contract: 'migration.portfolio.v2',
    score,
    total_capabilities: total,
    ready_to_deprecate: ready,
    blocked: total - ready,
    by_grade: byGrade,
    evidence_backed: true,
    items
  };
}

module.exports = { migrationPortfolio };
