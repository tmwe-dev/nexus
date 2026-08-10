const { evidenceReadiness } = require('./evidenceReadiness');

function planCutover(capability) {
  const evidence = evidenceReadiness(capability);
  if (!evidence.found) return { contract: 'migration.cutover-plan.v1', capability, executable: false, reason: 'capability_not_mapped', steps: [] };
  const readiness = evidence.readiness;
  const executable = readiness.ready_to_deprecate === true;
  const steps = [
    'freeze contract major version',
    'confirm accepted shadow evidence exists',
    'confirm caller inventory is complete and active callers are zero',
    'confirm rollback route is available',
    'confirm observability is active',
    'switch consumer routing to Nexus',
    'observe error and mismatch rates',
    'keep legacy source available during stabilization'
  ];
  return {
    contract: 'migration.cutover-plan.v1',
    capability,
    executable,
    readiness_score: readiness.score,
    blockers: readiness.blockers,
    evidence: evidence.evidence,
    source_write_required: false,
    destructive_action_required: false,
    steps
  };
}

module.exports = { planCutover };
