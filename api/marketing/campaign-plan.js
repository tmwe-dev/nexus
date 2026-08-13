'use strict';

const { planCampaign } = require('../../modules/marketing/campaign/service');
const { requireScope } = require('../../modules/security/apiGuard');
const { SCOPES } = require('../../modules/security/scopes');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const guard = requireScope(req, res, SCOPES.MARKETING_PLAN);
  if (!guard.ok) return;
  try {
    const payload = await planCampaign(req.body || {});
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(502).json({ error: 'MARKETING_CAMPAIGN_PLAN_UNAVAILABLE', message: error instanceof Error ? error.message : String(error) });
  }
};
