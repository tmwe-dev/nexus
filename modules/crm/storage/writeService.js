'use strict';
const store = require('./store');

const ALLOWED = new Set(['contacts','accounts','activities','opportunities']);
function assertEntity(entity){ if(!ALLOWED.has(entity)) throw new Error('unsupported_crm_entity'); }
function sanitize(record={}){ const out={...record}; delete out.stored_at; return out; }

async function createOrUpdate(entity, record){
  assertEntity(entity);
  const clean=sanitize(record);
  if(!clean.nexus_id && !clean.id && !clean.legacy_id) throw new Error('crm_record_id_required');
  return store.upsert(entity,{...clean,source:clean.source||'nexus'});
}

async function deleteRecord(entity,id){
  assertEntity(entity);
  if(!id) throw new Error('crm_record_id_required');
  return store.remove(entity,id);
}

module.exports={createOrUpdate,deleteRecord};
