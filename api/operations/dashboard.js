const { operationalDashboard } = require('../../modules/operations/dashboard');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(200).json(operationalDashboard());
};