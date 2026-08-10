const { listUsage, summarizeUsage } = require('../../modules/observability/ledger');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const filters = {
    correlation_id: req.query.correlation_id || null,
    service: req.query.service || null,
    limit: req.query.limit || 100
  };
  return res.status(200).json({
    contract: 'usage.ledger.v1',
    items: listUsage(filters),
    summary: summarizeUsage(filters),
    persistence: 'memory-only',
    warning: 'Production persistence backend not configured yet.'
  });
};
