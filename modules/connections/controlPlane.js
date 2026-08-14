'use strict';

const { CONNECTIONS, getConnection } = require('../../registry/connections');
const { capabilitiesForOwner } = require('../../registry/capabilities');
const { resolveConnectionConfig } = require('./config');

function connectionState(connection) {
  const config = resolveConnectionConfig(connection);
  const capabilities = capabilitiesForOwner(connection.id);
  const excluded = connection.status === 'excluded-until-final-phase';
  const deferred = excluded || connection.status.includes('pending') || connection.status.includes('planned');
  const scopes = Array.from(new Set(capabilities.map(item => item.scope).filter(Boolean))).sort();

  return {
    id: connection.id,
    name: connection.name,
    kind: connection.kind,
    mode: connection.mode,
    status: connection.status,
    source_of_truth: Boolean(connection.sourceOfTruth),
    repository: connection.repository || null,
    internal: Boolean(config?.internal),
    deferred,
    excluded,
    endpoint_configured: Boolean(config?.base),
    token_configured: connection.tokenEnv ? Boolean(config?.token) : true,
    configured: excluded ? false : Boolean(config?.configured),
    target_configured: Boolean(config?.target_configured),
    runtime_endpoint_env: config?.endpoint_env || null,
    runtime_token_env: config?.token_env || null,
    target_endpoint_env: config?.target_endpoint_env || null,
    target_token_env: config?.target_token_env || null,
    capabilities: capabilities.map(item => item.name),
    capability_routes: capabilities.map(item => ({ name:item.name, route:item.route, method:item.method, status:item.status })),
    required_scopes: scopes,
    source_mutation_allowed: false
  };
}

function listConnectionStates() { return CONNECTIONS.map(connectionState); }
function readConnectionState(id) { const connection = getConnection(id); return connection ? connectionState(connection) : null; }

function connectionSummary() {
  const items = listConnectionStates();
  return {
    contract: 'connections.control-plane.v2',
    registry: 'canonical',
    total: items.length,
    configured: items.filter(item => item.configured).length,
    deferred: items.filter(item => item.deferred).length,
    excluded: items.filter(item => item.excluded).length,
    source_systems_read_only: items.filter(item => item.source_of_truth).every(item => item.source_mutation_allowed === false),
    items
  };
}

module.exports = { connectionState, listConnectionStates, readConnectionState, connectionSummary };
