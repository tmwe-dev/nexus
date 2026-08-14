'use strict';

const { getConnection } = require('../../registry/connections');

function firstConfigured(primary, aliases = []) {
  const names = [primary, ...aliases].filter(Boolean);
  for (const name of names) {
    const value = String(process.env[name] || '').trim();
    if (value) return { env: name, value };
  }
  return { env: primary || null, value: '' };
}

function resolveConnectionConfig(connectionOrId) {
  const connection = typeof connectionOrId === 'string' ? getConnection(connectionOrId) : connectionOrId;
  if (!connection) return null;

  const endpoint = firstConfigured(connection.endpointEnv, connection.endpointEnvAliases || []);
  const token = firstConfigured(connection.tokenEnv, connection.tokenEnvAliases || []);
  const targetEndpoint = firstConfigured(connection.targetEndpointEnv, connection.targetEndpointEnvAliases || []);
  const targetToken = firstConfigured(connection.targetTokenEnv, connection.targetTokenEnvAliases || []);
  const internal = connection.internal === true;
  const targetBase = (targetEndpoint.value || String(connection.targetDefaultBase || '').trim()).replace(/\/$/, '');

  return {
    id: connection.id,
    internal,
    base: endpoint.value.replace(/\/$/, ''),
    token: token.value,
    endpoint_env: endpoint.env,
    token_env: token.env,
    configured: internal || Boolean(endpoint.value && (!connection.tokenEnv || token.value)),
    target_base: targetBase,
    target_token: targetToken.value,
    target_endpoint_env: targetEndpoint.value ? targetEndpoint.env : null,
    target_source: targetEndpoint.value ? 'environment' : (targetBase ? 'registry-default' : null),
    target_token_env: targetToken.env,
    target_configured: Boolean(targetBase && (!connection.targetTokenEnv || targetToken.value))
  };
}

module.exports = { resolveConnectionConfig };
