const { getTool } = require('./toolRegistry');

async function executeAgentPlan(plan = {}) {
  const steps = Array.isArray(plan.steps) ? plan.steps : [];
  const maxSteps = Math.min(Number(plan.max_steps) || 8, 20);
  const results = [];

  for (const step of steps.slice(0, maxSteps)) {
    const tool = getTool(step.tool_id);
    if (!tool) {
      results.push({ step_id: step.id || null, status: 'blocked', reason: 'tool_not_found' });
      continue;
    }
    if (tool.side_effects && tool.requires_approval && !step.approved) {
      results.push({ step_id: step.id || null, tool_id: tool.id, status: 'approval_required' });
      continue;
    }
    try {
      const output = await tool.execute(step.input || {});
      results.push({ step_id: step.id || null, tool_id: tool.id, status: 'completed', output });
    } catch (error) {
      results.push({ step_id: step.id || null, tool_id: tool.id, status: 'failed', error: error instanceof Error ? error.message : String(error) });
      if (step.on_error !== 'continue') break;
    }
  }

  return {
    contract: 'agent.execution.v1',
    execution_mode: 'bounded',
    max_steps: maxSteps,
    results,
    completed: results.filter(r => r.status === 'completed').length,
    blocked: results.filter(r => r.status === 'blocked' || r.status === 'approval_required').length
  };
}

module.exports = { executeAgentPlan };
