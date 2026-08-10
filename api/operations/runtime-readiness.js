'use strict';
const store = require('../../modules/crm/storage/store');
const { mode: crmReadMode } = require('../../modules/crm/storage/readRouter');
const { authMode } = require('../../modules/security/serviceAuth');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const durable = store.durableConfig();
  let crmReachable = false;
  let crmCounts = {};
  if (durable.enabled) {
    try {
      crmCounts = await store.stats();
      crmReachable = true;
    } catch {
      crmReachable = false;
    }
  }
  const auth = authMode();
  const checks = {
    crm_store_configured: durable.enabled,
    crm_store_reachable: crmReachable,
    crm_read_mode: crmReadMode(),
    service_auth_mode: auth,
    service_auth_enforced: auth === 'enforce',
    service_token_registry_configured: Boolean(process.env.NEXUS_SERVICE_TOKEN_REGISTRY)
  };
  const productionReady = checks.crm_store_configured && checks.crm_store_reachable && checks.service_auth_enforced && checks.service_token_registry_configured;
  return res.status(200).json({
    contract: 'operations.runtime-readiness.v1',
    production_ready: productionReady,
    cutover_allowed: false,
    checks,
    crm_counts: crmCounts,
    note: 'Runtime readiness does not override migration evidence gates. Legacy systems remain read-only until cutover gates reach 100/100.'
  });
};
