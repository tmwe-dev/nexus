const { getCapabilityMigration } = require('./capabilityMap');

function planCutover(capability) {
  const item = getCapabilityMigration(capability);
  if (!item) return { contract: 'migration.cutover-plan.v1', capability, executable: false, reason: 'capability_not_mapped', steps: [] };
  const readiness = item.readiness;
  const executable = readiness.ready_to_deprecate === true;
  const steps = [
    'freeze contract major version',
    'confirm shadow comparison acceptance',
    'confirm active callers migrated',
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
    source: item.source,
    target: item.target,
    source_write_required: false,
    destructive_action_required: false,
    steps
  };
}

module.exports = { planCutover };
