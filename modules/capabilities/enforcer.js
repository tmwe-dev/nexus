const { getConnection } = require('../../registry/connections');

function checkCapability(serviceId, capability, { requireConfigured = false } = {}) {
  const connection = getConnection(serviceId);
  if (!connection) return { allowed: false, reason: 'service_not_registered', service_id: serviceId, capability };
  if (!Array.isArray(connection.capabilities) || !connection.capabilities.includes(capability)) {
    return { allowed: false, reason: 'capability_not_declared', service_id: serviceId, capability };
  }
  if (requireConfigured && connection.endpointEnv && !process.env[connection.endpointEnv]) {
    return { allowed: false, reason: 'service_not_configured', service_id: serviceId, capability };
  }
  return { allowed: true, service_id: serviceId, capability, mode: connection.mode };
}

function assertCapability(serviceId, capability, options) {
  const result = checkCapability(serviceId, capability, options);
  if (!result.allowed) {
    const error = new Error(`CAPABILITY_BLOCKED:${serviceId}:${capability}:${result.reason}`);
    error.code = 'CAPABILITY_BLOCKED';
    error.details = result;
    throw error;
  }
  return result;
}

module.exports = { checkCapability, assertCapability };