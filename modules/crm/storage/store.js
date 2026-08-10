'use strict';

const memory = { contacts: new Map(), accounts: new Map(), activities: new Map(), opportunities: new Map() };

function table(name) {
  if (!memory[name]) throw new Error(`unsupported_crm_store:${name}`);
  return memory[name];
}

function keyOf(record) {
  return String(record?.nexus_id || record?.id || record?.legacy_id || '').trim();
}

async function upsert(entity, record) {
  const key = keyOf(record);
  if (!key) throw new Error('crm_store_key_required');
  const value = { ...record, nexus_id: record.nexus_id || key, stored_at: new Date().toISOString() };
  table(entity).set(key, value);
  return value;
}

async function get(entity, id) { return table(entity).get(String(id)) || null; }
async function list(entity) { return Array.from(table(entity).values()); }
async function remove(entity, id) { return table(entity).delete(String(id)); }
async function stats() { return Object.fromEntries(Object.entries(memory).map(([k,v]) => [k, v.size])); }

module.exports = { upsert, get, list, remove, stats };
