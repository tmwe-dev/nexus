const { runCrmShadow } = require('./crmRunner');

function normalizeCases(input = []) {
  const cases = Array.isArray(input) && input.length ? input : [
    { id: 'default', filters: { limit: 50 } },
    { id: 'wca-matched', filters: { limit: 50, wca_match: 'matched' } },
    { id: 'wca-unmatched', filters: { limit: 50, wca_match: 'unmatched' } }
  ];
  return cases.slice(0, 10).map((item, index) => ({
    id: String(item.id || `case-${index + 1}`).slice(0, 60),
    filters: item.filters && typeof item.filters === 'object' ? item.filters : {},
    contact_id: item.contact_id || null,
    activity_limit: Math.max(1, Math.min(Number(item.activity_limit) || 50, 200))
  }));
}

async function runCrmShadowBatch(input = {}) {
  const cases = normalizeCases(input.cases);
  const runs = [];
  for (const item of cases) {
    try {
      const result = await runCrmShadow({ filters: item.filters, contact_id: item.contact_id, activity_limit: item.activity_limit });
      runs.push({ id: item.id, status: 'completed', result });
    } catch (error) {
      runs.push({ id: item.id, status: 'failed', error: error.message });
    }
  }

  const completed = runs.filter(item => item.status === 'completed');
  const accepted = completed.filter(item => item.result?.accepted === true).length;
  const comparableChecks = completed.reduce((sum, item) => sum + Number(item.result?.comparable_checks || 0), 0);
  const matchedChecks = completed.reduce((sum, item) => sum + Number(item.result?.matched_checks || 0), 0);

  return {
    contract: 'shadow.crm.batch.v1',
    source: 'navigator-read-only',
    candidate: 'nexus',
    total_runs: runs.length,
    completed_runs: completed.length,
    accepted_runs: accepted,
    comparable_checks: comparableChecks,
    matched_checks: matchedChecks,
    acceptance_ratio: comparableChecks ? matchedChecks / comparableChecks : 0,
    accepted: completed.length > 0 && accepted === completed.length && runs.every(item => item.status === 'completed'),
    runs
  };
}

module.exports = { runCrmShadowBatch, normalizeCases };
