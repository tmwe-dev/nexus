const { compareResults } = require('../../modules/conformance/compare');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body || {};
  if (body.reference === undefined || body.candidate === undefined) return res.status(400).json({ error: 'reference and candidate are required' });
  return res.status(200).json(compareResults(body.reference, body.candidate, body.options || {}));
};