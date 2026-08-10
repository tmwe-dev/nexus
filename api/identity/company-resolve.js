const { resolveCompany } = require('../../modules/identity/company/resolver');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const candidates = Array.isArray(req.body?.candidates) ? req.body.candidates : [];
  if (!candidates.length) return res.status(400).json({ error: 'CANDIDATES_REQUIRED' });
  try {
    const result = resolveCompany(candidates);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'IDENTITY_COMPANY_RESOLVE_FAILED', message: error instanceof Error ? error.message : String(error) });
  }
};
