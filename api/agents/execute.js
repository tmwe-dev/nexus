const { executeAgentPlan } = require('../../modules/agent-framework/executor');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const result = await executeAgentPlan(req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'AGENT_EXECUTION_FAILED', message: error instanceof Error ? error.message : String(error) });
  }
};
