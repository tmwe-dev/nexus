const { listPrompts } = require('../../modules/ai-platform/promptRegistry');
const { listTools } = require('../../modules/agent-framework/toolRegistry');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(200).json({
    contract: 'ai.capabilities.v1',
    layers: ['model-gateway','prompt-registry','tool-registry','agent-executor'],
    prompts: listPrompts(),
    tools: listTools(),
    orchestration_owner: 'cobra'
  });
};
