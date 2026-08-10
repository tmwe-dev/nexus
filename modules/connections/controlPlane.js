const { CONNECTIONS, getConnection } = require('../../registry/connections');

const SERVICE_SCOPES = Object.freeze({
  wca: ['wca:read'],
  'report-aziende': ['company-data:read'],
  identity: ['identity:read','identity:resolve'],
  funnemail: ['email:read','email:send'],
  bartalk: ['communication:session'],
  cobra: ['research:execute'],
  'ai-platform': ['ai:execute'],
  crm: ['crm:read'],
  navigator: [],
  tmwe2: []
});

function connectionState(connection) {
  const endpointConfigured = connection.endpointEnv ? Boolean(process.env[connection.endpointEnv]) : true;
  const tokenConfigured = connection.tokenEnv ? Boolean(process.env[connection.tokenEnv]) : true;
  const deferred = connection.id === 'report-aziende' || connection.id === 'tmwe2';
  const internal = !connection.endpointEnv;
  return {
    id: connection.id,
    name: connection.name,
    kind: connection.kind,
    mode: connection.mode,
    status: connection.status,
    source_of_truth: Boolean(connection.sourceOfTruth),
    repository: connection.repository || null,
    internal,
    deferred,
    endpoint_configured: endpointConfigured,
    token_configured: tokenConfigured,
    configured: internal || (endpointConfigured && tokenConfigured),
    capabilities: connection.capabilities || [],
    required_scopes: SERVICE_SCOPES[connection.id] || [],
    source_mutation_allowed: false
  };
}

function listConnectionStates() {
  return CONNECTIONS.map(connectionState);
}

function readConnectionState(id) {
  const connection = getConnection(id);
  return connection ? connectionState(connection) : null;
}

function connectionSummary() {
  const items = listConnectionStates();
  return {
    contract: 'connections.control-plane.v1',
    total: items.length,
    configured: items.filter(item => item.configured).length,
    deferred: items.filter(item => item.deferred).length,
    source_systems_read_only: items.filter(item => item.source_of_truth).every(item => item.source_mutation_allowed === false),
    items
  };
}

module.exports = { SERVICE_SCOPES, connectionState, listConnectionStates, readConnectionState, connectionSummary };
