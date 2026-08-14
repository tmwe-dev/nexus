'use strict';

const { getSalesPriorities } = require('../../modules/sales-intelligence/service');
const { requireScope } = require('../../modules/security/apiGuard');
const { SCOPES } = require('../../modules/security/scopes');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const guard = requireScope(req, res, SCOPES.SALES_READ);
  if (!guard.ok) return;
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
