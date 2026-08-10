const { previewDuplicates } = require('../../modules/crm/duplicates/service');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const payload = await previewDuplicates({
      search: req.query.search,
      country: req.query.country,
      origin: req.query.origin,
      limit: req.query.limit
    });
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(502).json({
      error: 'CRM_DUPLICATE_PREVIEW_UNAVAILABLE',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
