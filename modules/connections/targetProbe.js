'use strict';

const { getConnection } = require('../../registry/connections');
const { resolveConnectionConfig } = require('./config');

async function probeTarget(connectionOrId) {
  const connection = typeof connectionOrId === 'string' ? getConnection(connectionOrId) : connectionOrId;
  if (!connection) return { configured:false, reachable:false, reason:'connection_not_registered' };
  const cfg = resolveConnectionConfig(connection);
  if (!cfg?.target_configured || !cfg.target_base) return { service:connection.id, configured:false, reachable:false, reason:'target_not_configured' };

  const headers = { Accept:'application/json' };
  if (connection.targetAuthHeader && cfg.target_token) headers[connection.targetAuthHeader] = cfg.target_token;
  const healthPath = connection.targetHealthPath || '/health';
  try {
    const response = await fetch(`${cfg.target_base}${healthPath}`, { method:'GET', headers });
    const payload = await response.json().catch(() => null);
    return { service:connection.id, configured:true, reachable:response.ok, status:response.status, payload:response.ok?payload:null, reason:response.ok?null:`target_http_${response.status}` };
  } catch (error) {
    return { service:connection.id, configured:true, reachable:false, reason:error.message };
  }
}

module.exports = { probeTarget };
