const { runCrmShadow } = require('../../modules/shadow/crmRunner');

module.exports = async function handler(req, res) {
  if (!['GET','POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
  const input = req.method === 'POST' ? (req.body || {}) : (req.query || {});
  const limit = Math.max(1, Math.min(Number(input.limit) || 50, 200));
  const filters = {
    limit,
    offset: Math.max(0, Number(input.offset) || 0),
    search: input.search || undefined,
    country: input.country || undefined,
    origin: input.origin || undefined,
    lead_status: input.lead_status || undefined,
    wca_match: input.wca_match || undefined
  };
  try {
    const result = await runCrmShadow({ filters, contact_id: input.contact_id || null, activity_limit: input.activity_limit || 100 });
    return res.status(result.accepted ? 200 : 409).json(result);
  } catch (error) {
    return res.status(503).json({ contract: 'shadow.crm.run.v1', accepted: false, error: error.message });
  }
};
