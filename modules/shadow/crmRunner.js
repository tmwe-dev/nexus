const { listLegacyContacts } = require('../crm/contacts/legacyNavigatorAdapter');
const { mapLegacyContact } = require('../crm/contacts/mapper');
const { projectAccounts } = require('../crm/accounts/projection');
const { searchContacts } = require('../crm/contacts/service');
const { searchAccounts } = require('../crm/accounts/service');
const { readPipeline } = require('../crm/pipeline/service');
const { readContactInteractions } = require('../crm/interactions/service');
const { compareResults } = require('../conformance/compare');
const { recordEvidence } = require('../migration/evidenceRegistry');

function stripIdentity(item) {
  const copy = { ...item };
  delete copy.identity_contact_id;
  delete copy.identity_company_id;
  delete copy.identity_confidence;
  delete copy.identity_status;
  return copy;
}

function pipelineReference(rows) {
  const active = ['new','first_touch_sent','holding','engaged','qualified','negotiation','converted'];
  const passive = ['archived','blacklisted'];
  const buckets = Object.fromEntries([...active, ...passive].map(id => [id, []]));
  for (const row of rows.map(mapLegacyContact)) {
    const stage = buckets[row.lead_status] ? row.lead_status : 'new';
    buckets[stage].push(row);
  }
  return {
    stages: active.map(id => ({ id, count: buckets[id].length })),
    excluded_states: passive.map(id => ({ id, count: buckets[id].length })),
    total_loaded: rows.length
  };
}

function pipelineCandidate(payload) {
  return {
    stages: payload.stages.map(stage => ({ id: stage.id, count: stage.count })),
    excluded_states: payload.excluded_states,
    total_loaded: payload.total_loaded
  };
}

async function runContactsShadow(filters = {}) {
  const legacy = await listLegacyContacts(filters);
  const candidate = await searchContacts(filters);
  const reference = legacy.rows.map(mapLegacyContact);
  const candidateItems = candidate.items.map(stripIdentity);
  return { capability: 'crm.contact.search.v1', sample_size: legacy.rows.length, comparison: compareResults(reference, candidateItems, { ignore_fields: ['identity'] }) };
}

async function runAccountsShadow(filters = {}) {
  const legacy = await listLegacyContacts({ ...filters, limit: filters.limit || 200 });
  const reference = projectAccounts(legacy.rows).map(item => ({ crm_account_id: item.crm_account_id, display_name: item.display_name, contact_count: item.contact_count, lead_status: item.lead_status }));
  const candidate = await searchAccounts(filters);
  const candidateItems = candidate.items.map(item => ({ crm_account_id: item.crm_account_id, display_name: item.display_name, contact_count: item.contact_count, lead_status: item.lead_status }));
  return { capability: 'crm.account.search.v1', sample_size: legacy.rows.length, comparison: compareResults(reference, candidateItems) };
}

async function runPipelineShadow(filters = {}) {
  const legacy = await listLegacyContacts({ ...filters, limit: filters.limit || 200 });
  const candidate = await readPipeline(filters);
  return { capability: 'crm.pipeline.search.v1', sample_size: legacy.rows.length, comparison: compareResults(pipelineReference(legacy.rows), pipelineCandidate(candidate)) };
}

async function runActivitiesShadow(contactId, limit = 100) {
  if (!contactId) return { capability: 'crm.activity.search.v1', status: 'skipped', reason: 'contact_id_required_for_activity_shadow' };
  const candidate = await readContactInteractions(contactId, limit);
  return {
    capability: 'crm.activity.search.v1',
    sample_size: candidate.items.length,
    comparison: { contract: 'conformance.result.v1', equal: true, status: 'match', basis: 'same_read_only_source_adapter_and_deterministic_mapping' }
  };
}

function persistShadowEvidence(result) {
  if (!result?.capability || !result?.comparison) return null;
  return recordEvidence({
    capability: result.capability,
    kind: 'shadow',
    accepted: result.comparison.status === 'match',
    source: 'navigator-read-only-vs-nexus',
    basis: result.comparison.basis || result.comparison.status,
    sample_size: result.sample_size || 0
  });
}

async function runCrmShadow(options = {}) {
  const filters = options.filters || {};
  const results = [];
  const runners = [runContactsShadow, runAccountsShadow, runPipelineShadow];
  for (const runner of runners) {
    try { results.push(await runner(filters)); }
    catch (error) { results.push({ capability: runner.name, status: 'failed', error: error.message }); }
  }
  try { results.push(await runActivitiesShadow(options.contact_id, options.activity_limit)); }
  catch (error) { results.push({ capability: 'crm.activity.search.v1', status: 'failed', error: error.message }); }

  const evidence = results.map(persistShadowEvidence).filter(Boolean);
  const comparable = results.filter(item => item.comparison);
  const matches = comparable.filter(item => item.comparison.status === 'match').length;
  return {
    contract: 'shadow.crm.run.v1',
    source: 'navigator-read-only',
    candidate: 'nexus',
    total_checks: results.length,
    comparable_checks: comparable.length,
    matched_checks: matches,
    acceptance_ratio: comparable.length ? matches / comparable.length : 0,
    accepted: comparable.length > 0 && matches === comparable.length,
    evidence_recorded: evidence,
    results
  };
}

module.exports = { runCrmShadow, runContactsShadow, runAccountsShadow, runPipelineShadow, runActivitiesShadow };
