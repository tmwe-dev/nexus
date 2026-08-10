const { callerSummary } = require('../../modules/migration/callerInventory');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const capability = String(req.query.capability || '').trim() || null;
  return res.status(200).json(callerSummary(capability));
};
