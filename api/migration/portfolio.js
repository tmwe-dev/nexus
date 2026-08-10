const { migrationPortfolio } = require('../../modules/migration/portfolio');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(200).json(migrationPortfolio());
};
