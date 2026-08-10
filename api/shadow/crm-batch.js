const { runCrmShadowBatch } = require('../../modules/shadow/crmBatchRunner');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const result = await runCrmShadowBatch(req.body || {});
    return res.status(result.accepted ? 200 : 409).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
