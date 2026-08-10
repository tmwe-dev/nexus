const REQUIRED_GATES = [
  'contract_compatible',
  'shadow_acceptable',
  'callers_migrated',
  'rollback_ready',
  'observability_ready'
];

function evaluateMigrationGates(input = {}) {
  const gates = {};
  for (const gate of REQUIRED_GATES) gates[gate] = Boolean(input[gate]);
  const passed = Object.values(gates).filter(Boolean).length;
  const score = Math.round((passed / REQUIRED_GATES.length) * 100);
  const blockers = Object.entries(gates).filter(([, ok]) => !ok).map(([name]) => name);
  return {
    contract: 'migration.gates.v1',
    capability: input.capability || null,
    source: input.source || 'legacy',
    target: input.target || 'nexus',
    gates,
    score,
    ready_to_deprecate: blockers.length === 0,
    blockers
  };
}

module.exports = { REQUIRED_GATES, evaluateMigrationGates };
