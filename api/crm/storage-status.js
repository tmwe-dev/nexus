'use strict';
const store = require('../../modules/crm/storage/store');
const { mode } = require('../../modules/crm/storage/readRouter');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    contract: 'crm.storage.status.v1',
    independent_storage: true,
    persistence: process.env.NEXUS_CRM_DATABASE_URL ? 'configured' : 'memory_only',
    read_mode: mode(),
    safe_default: 'legacy',
    writes_to_legacy: false,
    counts: await store.stats(),
    cutover_allowed: false,
    note: 'Nexus storage is isolated. Legacy remains read-only until evidence gates pass.'
  });
};
