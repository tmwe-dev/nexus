'use strict';

const store = require('./store');

const MODES = new Set(['legacy', 'shadow', 'nexus']);
function mode() {
  const requested = String(process.env.NEXUS_CRM_READ_MODE || 'legacy').toLowerCase();
  return MODES.has(requested) ? requested : 'legacy';
}

async function read({ entity, id, legacyRead, compare }) {
  const currentMode = mode();
  if (currentMode === 'legacy') return { source: 'legacy', data: await legacyRead(), compared: false };

  const nexusData = await store.get(entity, id);
  if (currentMode === 'nexus') {
    if (!nexusData) throw new Error('nexus_crm_record_not_found');
    return { source: 'nexus', data: nexusData, compared: false };
  }

  const legacyData = await legacyRead();
  let comparison = null;
  if (typeof compare === 'function') comparison = await compare(legacyData, nexusData);
  return { source: 'legacy', data: legacyData, compared: true, shadow: { nexus_present: Boolean(nexusData), comparison } };
}

module.exports = { read, mode };
