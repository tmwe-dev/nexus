const { evaluateMigrationGates } = require('./gates');

function migrationReadiness(input = {}) {
  const gateResult = evaluateMigrationGates(input);
  const weights = {
    contract_compatible: 25,
    shadow_acceptable: 25,
    callers_migrated: 20,
    rollback_ready: 15,
    observability_ready: 15
  };
  let score = 0;
  for (const [gate, weight] of Object.entries(weights)) if (gateResult.gates[gate]) score += weight;
  return {
    contract: 'migration.readiness.v1',
    capability: gateResult.capability,
    score,
    grade: score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'E',
    ready_to_deprecate: score === 100,
    blockers: gateResult.blockers,
    gates: gateResult.gates
  };
}

module.exports = { migrationReadiness };
