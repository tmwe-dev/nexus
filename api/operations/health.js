const { buildOperationalHealth } = require('../../modules/operations/healthSummary');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(200).json(buildOperationalHealth());
};
