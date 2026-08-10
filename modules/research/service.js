const { buildResearchRequest } = require('./request');
const { executeWithCobra } = require('./cobraClient');

async function research(input = {}) {
  const request = buildResearchRequest(input);
  const execution = await executeWithCobra(request);

  return {
    contract: 'research.result.v1',
    request_id: request.request_id,
    mode: request.mode,
    depth: request.depth,
    status: execution.status,
    partial: Boolean(execution.partial),
    orchestration_owner: 'cobra',
    source_systems_mutated: false,
    result: execution.result,
    warnings: execution.warnings || [],
    fallback: execution.status === 'completed' ? null : {
      rule: 'Caller must continue with available CRM/WCA/Identity data when research is unavailable.',
      recommended_action: 'continue_without_research'
    }
  };
}

module.exports = { research };
