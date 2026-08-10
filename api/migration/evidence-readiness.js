const { evidenceReadiness } = require('../../modules/migration/evidenceReadiness');
const { hydrateEvidence } = require('../../modules/migration/evidenceRegistry');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const capability = String(req.query.capability || '').trim();
  if (!capability) return res.status(400).json({ error: 'capability is required' });
  let hydration = { durable: false, loaded: 0 };
  try { hydration = await hydrateEvidence(capability); } catch (error) { hydration = { durable: false, loaded: 0, error: error.message }; }
  const payload = evidenceReadiness(capability);
  return res.status(payload.found ? 200 : 404).json({ ...payload, hydration });
};
