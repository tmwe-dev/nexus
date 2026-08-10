function buildRollbackPlan(input = {}) {
  const steps = Array.isArray(input.steps) ? input.steps : [];
  return {
    contract: 'rollback.plan.v1',
    capability: input.capability || null,
    trigger_conditions: input.trigger_conditions || ['critical_error_rate','data_mismatch','consumer_failure'],
    steps,
    owner: input.owner || 'nexus-migration',
    reversible: input.reversible !== false,
    source_write_required: false,
    rules: [
      'Rollback must be possible before legacy deprecation.',
      'Rollback must not require modifying source datasets.',
      'Consumer routing must be restorable independently of source systems.'
    ]
  };
}

module.exports = { buildRollbackPlan };
