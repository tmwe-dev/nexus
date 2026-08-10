const { evidenceReadiness } = require('./evidenceReadiness');
const { config: evidenceStoreConfig } = require('./evidenceStore');

function planCutover(capability) {
  const evidence = evidenceReadiness(capability);
  if (!evidence.found) return { contract: 'migration.cutover-plan.v2', capability, executable: false, reason: 'capability_not_mapped', steps: [] };
  const readiness = evidence.readiness;
  const durableEvidenceReady = Boolean(evidenceStoreConfig());
  const blockers = [...readiness.blockers];
  if (!durableEvidenceReady) blockers.push('durable_evidence_store');
  const executable = readiness.ready_to_deprecate === true && durableEvidenceReady;
  const steps = [
    'freeze contract major version',
    'confirm accepted durable shadow evidence exists',
    'confirm caller inventory is complete and active callers are zero',
    'confirm rollback route is available',
    'confirm observability is active',
    'confirm durable control-plane evidence store is configured',
    'switch consumer routing to Nexus',
    'observe error and mismatch rates',
    'keep legacy source available during stabilization'
  ];
  return {
    contract: 'migration.cutover-plan.v2',
    capability,
    executable,
    readiness_score: readiness.score,
    durable_evidence_ready: durableEvidenceReady,
    blockers,
    evidence: evidence.evidence,
    source_write_required: false,
    destructive_action_required: false,
    steps
  };
}

module.exports = { planCutover };
