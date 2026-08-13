'use strict';

const { getConnection } = require('../../registry/connections');
const { getCapability } = require('../../registry/capabilities');
const { resolveConnectionConfig } = require('../connections/config');

function checkCapability(serviceId, capabilityName, { requireConfigured = false, requireRoute = true } = {}) {
  const connection = getConnection(serviceId);
  if (!connection) return { allowed:false, reason:'service_not_registered', service_id:serviceId, capability:capabilityName };

  const capability = getCapability(capabilityName);
  if (!capability) return { allowed:false, reason:'capability_not_registered', service_id:serviceId, capability:capabilityName };
  if (capability.owner !== serviceId) return { allowed:false, reason:'capability_owned_by_other_service', service_id:serviceId, owner:capability.owner, capability:capabilityName };
  if (requireRoute && !capability.route) return { allowed:false, reason:'capability_route_not_implemented', service_id:serviceId, capability:capabilityName, status:capability.status };

  const config = resolveConnectionConfig(connection);
  if (requireConfigured && !config?.configured) {
    return { allowed:false, reason:'service_not_configured', service_id:serviceId, capability:capabilityName, endpoint_env:config?.endpoint_env || connection.endpointEnv || null };
  }

  return {
    allowed:true,
    service_id:serviceId,
    capability:capabilityName,
    contract:capability.name,
    route:capability.route,
    method:capability.method,
    scope:capability.scope,
    status:capability.status,
    side_effects:capability.side_effects,
    idempotency_required:capability.idempotency_required,
    mode:connection.mode
  };
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
