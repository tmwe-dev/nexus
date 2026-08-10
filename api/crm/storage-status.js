'use strict';
const store = require('../../modules/crm/storage/store');
const { mode } = require('../../modules/crm/storage/readRouter');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const durable = store.durableConfig();
  let counts = {};
  let storeReachable = true;
  try { counts = await store.stats(); } catch { storeReachable = false; }
  res.status(200).json({
    contract: 'crm.storage.status.v1',
    independent_storage: true,
    persistence: durable.enabled ? (storeReachable ? 'configured' : 'unreachable') : 'memory_only',
    read_mode: mode(),
    safe_default: 'legacy',
    writes_to_legacy: false,
    counts,
    cutover_allowed: durable.enabled && storeReachable && mode() === 'nexus',
    note: 'Nexus storage is isolated. Legacy remains read-only until evidence gates pass.'
  });
};
