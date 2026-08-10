const { migrationPortfolio } = require('../../modules/migration/portfolio');
const { hydrateEvidence } = require('../../modules/migration/evidenceRegistry');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  let hydration = { durable: false, loaded: 0 };
  try { hydration = await hydrateEvidence(); } catch (error) { hydration = { durable: false, loaded: 0, error: error.message }; }
  return res.status(200).json({ ...migrationPortfolio(), hydration });
};
