const { getCapabilityMigration } = require('./capabilityMap');
const { callerSummary } = require('./callerInventory');
const { getEvidence } = require('./evidenceRegistry');
const { migrationReadiness } = require('./readiness');

function evidenceReadiness(capability) {
  const mapped = getCapabilityMigration(capability);
  if (!mapped) return { contract: 'migration.evidence-readiness.v1', capability, found: false };

  const shadow = getEvidence(capability, 'shadow');
  const observability = getEvidence(capability, 'observability');
  const callers = callerSummary(capability);
  const callerInventoryComplete = !['discovery_required', 'mixed'].includes(callers.inventory_status);
  const evidenceInput = {
    capability,
    source: mapped.source,
    target: mapped.target,
    contract_compatible: mapped.contract_compatible === true,
    shadow_acceptable: shadow?.accepted === true,
    callers_migrated: callerInventoryComplete && callers.total_known_callers > 0 && callers.active_callers === 0,
    rollback_ready: mapped.rollback_ready === true,
    observability_ready: observability?.accepted === true
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
      observability: observability || null
    },
    rule: 'No gate is promoted from inference alone; shadow and observability require accepted recorded runtime evidence, while caller migration requires a verified inventory with zero active callers.'
  };
}

module.exports = { evidenceReadiness };
