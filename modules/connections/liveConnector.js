'use strict';

function config(name) {
  const key = String(name || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  const base = String(process.env[`NEXUS_${key}_URL`] || '').replace(/\/$/, '');
  const token = String(process.env[`NEXUS_${key}_TOKEN`] || '');
  return { name, base, token, configured: Boolean(base && token) };
}

async function request(name, path, options = {}) {
  const cfg = config(name);
  if (!cfg.configured) throw new Error(`${name}_connector_not_configured`);
  const response = await fetch(`${cfg.base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.token}`,
      ...(options.headers || {})
    }
  });
  if (!response.ok) throw new Error(`${name}_connector_http_${response.status}`);
  if (response.status === 204) return null;
  return response.json();
}

async function probe(name, healthPath = '/health') {
  const cfg = config(name);
  if (!cfg.configured) return { service: name, configured: false, reachable: false };
  try {
    await request(name, healthPath, { method: 'GET' });
    return { service: name, configured: true, reachable: true };
  } catch (error) {
    return { service: name, configured: true, reachable: false, reason: error.message };
  }
}

module.exports = { config, request, probe };
