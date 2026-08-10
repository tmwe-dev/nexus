const { getCapabilityMigration } = require('./capabilityMap');
const { callerSummary } = require('./callerInventory');
const { getEvidence } = require('./evidenceRegistry');
const { migrationReadiness } = require('./readiness');

function evidenceReadiness(capability) {
  const mapped = getCapabilityMigration(capability);
  if (!mapped) return { contract: 'migration.evidence-readiness.v1', capability, found: false };

  const shadow = getEvidence(capability, 'shadow');
  const callers = callerSummary(capability);
  const evidenceInput = {
    capability,
    source: mapped.source,
    target: mapped.target,
    contract_compatible: mapped.contract_compatible === true,
    shadow_acceptable: shadow?.accepted === true,
    callers_migrated: callers.total_known_callers > 0 && callers.active_callers === 0,
    rollback_ready: mapped.rollback_ready === true,
    observability_ready: mapped.observability_ready === true
  };

  return {
    contract: 'migration.evidence-readiness.v1',
    capability,
    found: true,
    readiness: migrationReadiness(evidenceInput),
    evidence: {
      contract: evidenceInput.contract_compatible ? 'declared_stable_contract' : 'missing',
      shadow: shadow || null,
      callers,
      rollback: evidenceInput.rollback_ready ? 'declared_reversible' : 'missing',
      observability: evidenceInput.observability_ready ? 'instrumented' : 'missing'
    },
    rule: 'No gate is promoted from inference alone; shadow requires accepted recorded evidence and caller migration requires a non-empty inventory with zero active callers.'
  };
}

module.exports = { evidenceReadiness };
