const { listDeprecations, registerDeprecation } = require('../../modules/migration/deprecations');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json({ contract: 'deprecation.registry.v1', items: listDeprecations() });
  if (req.method === 'POST') {
    try { return res.status(201).json(registerDeprecation(req.body || {})); }
    catch (error) { return res.status(400).json({ error: error.message }); }
  }
  return res.status(405).json({ error: 'Method not allowed' });
};
