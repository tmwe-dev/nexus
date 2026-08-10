const { searchContacts } = require('../../modules/crm/contacts/service');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const payload = await searchContacts({
      search: req.query.search,
      country: req.query.country,
      origin: req.query.origin,
      lead_status: req.query.lead_status,
      wca_match: req.query.wca_match,
      limit: req.query.limit,
      offset: req.query.offset
    });
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(502).json({
      error: 'CRM_CONTACT_SEARCH_UNAVAILABLE',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
