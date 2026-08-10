const { checkCapability } = require('../../modules/capabilities/enforcer');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const service = String(req.query.service || '').trim();
  const capability = String(req.query.capability || '').trim();
  if (!service || !capability) return res.status(400).json({ error: 'service and capability are required' });
  const result = checkCapability(service, capability, { requireConfigured: req.query.configured === 'true' });
  return res.status(result.allowed ? 200 : 403).json(result);
};