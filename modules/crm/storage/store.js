'use strict';

const memory = { contacts: new Map(), accounts: new Map(), activities: new Map(), opportunities: new Map() };

function table(name) {
  if (!memory[name]) throw new Error(`unsupported_crm_store:${name}`);
  return memory[name];
}

function keyOf(record) {
  return String(record?.nexus_id || record?.id || record?.legacy_id || '').trim();
}

function durableConfig() {
  const base = String(process.env.NEXUS_CRM_STORE_URL || '').replace(/\/$/, '');
  const token = String(process.env.NEXUS_CRM_STORE_TOKEN || '');
  return { enabled: Boolean(base && token), base, token };
}

async function durableFetch(path, options = {}) {
  const cfg = durableConfig();
  if (!cfg.enabled) return null;
  const response = await fetch(`${cfg.base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.token}`,
      apikey: cfg.token,
      Prefer: 'return=representation,resolution=merge-duplicates',
      ...(options.headers || {})
    }
  });
  if (!response.ok) throw new Error(`crm_store_http_${response.status}`);
  if (response.status === 204) return null;
  return response.json();
}

async function upsert(entity, record) {
  const key = keyOf(record);
  if (!key) throw new Error('crm_store_key_required');
  const value = { ...record, nexus_id: record.nexus_id || key, stored_at: new Date().toISOString() };
  if (durableConfig().enabled) {
    const rows = await durableFetch('/crm_records?on_conflict=entity,nexus_id', {
      method: 'POST',
      body: JSON.stringify([{ entity, nexus_id: key, legacy_id: record.legacy_id || null, source: record.source || 'nexus', payload: value, updated_at: value.stored_at }])
    });
    return rows?.[0]?.payload || value;
  }
  table(entity).set(key, value);
  return value;
}

async function get(entity, id) {
  if (durableConfig().enabled) {
    const rows = await durableFetch(`/crm_records?entity=eq.${encodeURIComponent(entity)}&nexus_id=eq.${encodeURIComponent(String(id))}&select=payload&limit=1`);
    return rows?.[0]?.payload || null;
  }
  return table(entity).get(String(id)) || null;
}

async function list(entity) {
  if (durableConfig().enabled) {
    const rows = await durableFetch(`/crm_records?entity=eq.${encodeURIComponent(entity)}&select=payload&order=updated_at.desc`);
    return (rows || []).map(row => row.payload);
  }
  return Array.from(table(entity).values());
}

async function remove(entity, id) {
  if (durableConfig().enabled) {
    await durableFetch(`/crm_records?entity=eq.${encodeURIComponent(entity)}&nexus_id=eq.${encodeURIComponent(String(id))}`, { method: 'DELETE' });
    return true;
  }
  return table(entity).delete(String(id));
}

async function stats() {
  if (!durableConfig().enabled) return Object.fromEntries(Object.entries(memory).map(([k,v]) => [k, v.size]));
  const rows = await durableFetch('/crm_records?select=entity,nexus_id');
  return (rows || []).reduce((acc, row) => { acc[row.entity] = (acc[row.entity] || 0) + 1; return acc; }, {});
}

module.exports = { upsert, get, list, remove, stats, durableConfig };
