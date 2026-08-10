const { deployPreflight } = require('../../modules/deploy/preflight');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const payload = deployPreflight();
  return res.status(payload.deployable ? 200 : 503).json(payload);
};