const { runCrmShadow } = require('./crmRunner');
const { recordEvidence } = require('../migration/evidenceRegistry');

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

function aggregateCapabilityEvidence(runs) {
  const byCapability = new Map();
  for (const run of runs) {
    if (run.status !== 'completed') continue;
    for (const item of run.result?.results || []) {
      if (!item.capability || !item.comparison) continue;
      if (!byCapability.has(item.capability)) byCapability.set(item.capability, []);
      byCapability.get(item.capability).push(item);
    }
  }

  const evidence = [];
  for (const [capability, items] of byCapability.entries()) {
    const accepted = items.length === runs.length && items.every(item => item.comparison?.status === 'match');
    const sampleSize = items.reduce((sum, item) => sum + Number(item.sample_size || 0), 0);
    evidence.push(recordEvidence({
      capability,
      kind: 'shadow',
      accepted,
      source: 'navigator-read-only-vs-nexus-batch',
      basis: accepted ? 'all_batch_cases_match' : 'one_or_more_batch_cases_not_comparable_or_mismatch',
      sample_size: sampleSize,
      metadata: { batch_cases: runs.length, comparable_cases: items.length }
    }));
  }
  return evidence;
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
  const evidence = aggregateCapabilityEvidence(runs);

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
    evidence,
    runs
  };
}

module.exports = { runCrmShadowBatch, normalizeCases, aggregateCapabilityEvidence };
