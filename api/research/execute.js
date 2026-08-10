const { research } = require('../../modules/research/service');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const payload = await research(req.body || {});
    const status = payload.status === 'completed' ? 200 : payload.status === 'partial' ? 206 : 503;
    return res.status(status).json(payload);
  } catch (error) {
    if (error && error.message === 'RESEARCH_QUERY_REQUIRED') return res.status(400).json({ error: 'query or instruction is required' });
    return res.status(500).json({ error: 'RESEARCH_EXECUTION_FAILED', message: error instanceof Error ? error.message : String(error) });
  }
};
