const { getSalesPriorities } = require('../../modules/sales-intelligence/service');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const payload = await getSalesPriorities({
      search: req.query.search,
      country: req.query.country,
      origin: req.query.origin,
      wca_match: req.query.wca_match,
      limit: req.query.limit,
      offset: req.query.offset
    });
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(502).json({ error: 'SALES_INTELLIGENCE_UNAVAILABLE', message: error instanceof Error ? error.message : String(error) });
  }
};
