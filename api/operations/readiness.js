const { deploymentReadiness } = require('../../modules/operations/readiness');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const payload = deploymentReadiness();
  return res.status(payload.deployable ? 200 : 503).json(payload);
};
