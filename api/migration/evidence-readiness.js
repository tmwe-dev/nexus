const { evidenceReadiness } = require('../../modules/migration/evidenceReadiness');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const capability = String(req.query.capability || '').trim();
  if (!capability) return res.status(400).json({ error: 'capability is required' });
  const payload = evidenceReadiness(capability);
  return res.status(payload.found ? 200 : 404).json(payload);
};
