'use strict';

const { getConnection } = require('../../registry/connections');
const { resolveConnectionConfig } = require('./config');

function normalizeId(name) { return String(name || '').trim().toLowerCase(); }

function config(name) {
  const id = normalizeId(name);
  const connection = getConnection(id);
  if (!connection) return { name:id || name, base:'', token:'', configured:false, reason:'connection_not_registered' };
  const cfg = resolveConnectionConfig(connection);
  return { name:id, base:cfg.base, token:cfg.token, configured:cfg.configured, endpoint_env:cfg.endpoint_env, token_env:cfg.token_env };
}

async function request(name, path, options = {}) {
  const cfg = config(name);
  if (!cfg.configured || !cfg.base) throw new Error(`${cfg.name}_connector_not_configured`);
  const response = await fetch(`${cfg.base}${path}`, {
    ...options,
    headers: {
      'Content-Type':'application/json',
      ...(cfg.token ? { Authorization:`Bearer ${cfg.token}` } : {}),
      ...(options.headers || {})
    }
  });
  if (!response.ok) throw new Error(`${cfg.name}_connector_http_${response.status}`);
  if (response.status === 204) return null;
  return response.json();
}

async function probe(name, healthPath = '/health') {
  const cfg = config(name);
  if (!cfg.configured || !cfg.base) return { service:cfg.name, configured:false, reachable:false, reason:cfg.reason || 'connector_not_configured' };
  try {
    await request(name, healthPath, { method:'GET' });
    return { service:cfg.name, configured:true, reachable:true };
  } catch (error) {
    return { service:cfg.name, configured:true, reachable:false, reason:error.message };
  }
}

module.exports = { config, request, probe };
