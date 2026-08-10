const { planCutover } = require('../../modules/migration/cutoverPlanner');
const { hydrateEvidence } = require('../../modules/migration/evidenceRegistry');
const { requireScope } = require('../../modules/security/apiGuard');
const { SCOPES } = require('../../modules/security/scopes');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const guard = requireScope(req, res, SCOPES.CUTOVER_PLAN);
  if (!guard.ok) return;
  const capability = String(req.query.capability || '').trim();
  if (!capability) return res.status(400).json({ error: 'capability is required' });
  let hydration = { durable: false, loaded: 0 };
  try { hydration = await hydrateEvidence(capability); } catch (error) { hydration = { durable: false, loaded: 0, error: error.message }; }
  const plan = planCutover(capability);
  return res.status(plan.executable ? 200 : 409).json({ ...plan, hydration });
};
