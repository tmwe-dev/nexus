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

  return {
    contract: 'deployment.readiness.v2',
    runtime: 'nodejs20.x',
    runtime_env: requiredRuntime.map(name => ({ name, configured: Boolean(process.env[name]) })),
    connections: optionalConnections,
    control_plane: controlPlane,
    deployable: blockers.length === 0,
    production_cutover_evidence_ready: controlPlane.ready,
    blockers: blockers.map(item => ({ id: item.id, endpoint_configured: item.endpoint_configured, token_configured: item.token_configured })),
    note: 'Nexus may deploy without the control plane during extraction, but production legacy cutover requires durable migration evidence. Readiness exposes presence only and never returns secret values.'
  };
}

module.exports = { deploymentReadiness };
