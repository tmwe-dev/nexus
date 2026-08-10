const { CONNECTIONS } = require('../../registry/connections');

function deploymentReadiness() {
  const requiredRuntime = ['NODE_ENV'];
  const optionalConnections = CONNECTIONS.filter(c => c.endpointEnv).map(c => ({
    id: c.id,
    endpoint_env: c.endpointEnv,
    token_env: c.tokenEnv || null,
    endpoint_configured: Boolean(process.env[c.endpointEnv]),
    token_configured: c.tokenEnv ? Boolean(process.env[c.tokenEnv]) : true,
    deferred: c.id === 'report-aziende' || c.id === 'tmwe2'
  }));

  const blockers = optionalConnections.filter(c => !c.deferred && (!c.endpoint_configured || !c.token_configured));
  const controlPlane = {
    endpoint_configured: Boolean(process.env.NEXUS_CONTROL_PLANE_URL),
    key_configured: Boolean(process.env.NEXUS_CONTROL_PLANE_KEY)
  };
  controlPlane.ready = controlPlane.endpoint_configured && controlPlane.key_configured;

  const authMode = String(process.env.NEXUS_AUTH_MODE || 'audit').toLowerCase();
  const auth = {
    mode: ['off','audit','enforce'].includes(authMode) ? authMode : 'audit',
    registry_configured: Boolean(process.env.NEXUS_SERVICE_TOKEN_REGISTRY)
  };
  auth.production_ready = auth.mode === 'enforce' && auth.registry_configured;

  return {
    contract: 'deployment.readiness.v3',
    runtime: 'nodejs20.x',
    runtime_env: requiredRuntime.map(name => ({ name, configured: Boolean(process.env[name]) })),
    connections: optionalConnections,
    control_plane: controlPlane,
    service_auth: auth,
    deployable: blockers.length === 0,
    production_cutover_evidence_ready: controlPlane.ready,
    production_service_auth_ready: auth.production_ready,
    blockers: blockers.map(item => ({ id: item.id, endpoint_configured: item.endpoint_configured, token_configured: item.token_configured })),
    note: 'Nexus may deploy during extraction with auth in audit mode. Production cutover requires durable evidence plus service auth in enforce mode. Secret values are never returned.'
  };
}

module.exports = { deploymentReadiness };
