const { migrationReadiness } = require('../../modules/migration/readiness');

module.exports = async function handler(req, res) {
  if (!['GET','POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
  const input = req.method === 'POST' ? (req.body || {}) : (req.query || {});
  const bool = value => value === true || value === 'true' || value === '1';
  const payload = migrationReadiness({
    capability: input.capability || null,
    source: input.source || 'legacy',
    target: input.target || 'nexus',
    contract_compatible: bool(input.contract_compatible),
    shadow_acceptable: bool(input.shadow_acceptable),
    callers_migrated: bool(input.callers_migrated),
    rollback_ready: bool(input.rollback_ready),
    observability_ready: bool(input.observability_ready)
  });
  return res.status(200).json(payload);
};
