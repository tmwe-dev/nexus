const { listCapabilityMigrations } = require('./capabilityMap');

function migrationPortfolio() {
  const items = listCapabilityMigrations();
  const total = items.length;
  const score = total ? Math.round(items.reduce((sum, item) => sum + item.readiness.score, 0) / total) : 0;
  const ready = items.filter(item => item.readiness.ready_to_deprecate).length;
  const byGrade = items.reduce((acc, item) => {
    const grade = item.readiness.grade;
    acc[grade] = (acc[grade] || 0) + 1;
    return acc;
  }, {});
  return {
    contract: 'migration.portfolio.v1',
    score,
    total_capabilities: total,
    ready_to_deprecate: ready,
    blocked: total - ready,
    by_grade: byGrade,
    items
  };
}

module.exports = { migrationPortfolio };
