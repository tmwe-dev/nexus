const { CONNECTIONS, publicConnection } = require('../../registry/connections');
const { listCircuitStates } = require('../resilience/circuitBreaker');

function buildOperationalHealth() {
  const circuits = new Map(listCircuitStates().map(item => [item.service, item]));
  const services = CONNECTIONS.map(connection => {
    const pub = publicConnection(connection);
    const circuit = circuits.get(connection.id) || null;
    const configured = pub.configured || !connection.endpointEnv;
    let status = 'ready';
    if (connection.status === 'excluded-until-final-phase') status = 'excluded';
    else if (connection.id === 'report-aziende') status = 'deferred';
    else if (!configured && connection.endpointEnv) status = 'not-configured';
    else if (circuit?.state === 'open') status = 'degraded';
    return { ...pub, operational_status: status, circuit_state: circuit?.state || 'closed' };
  });

  const active = services.filter(item => !['excluded', 'deferred'].includes(item.operational_status));
  const degraded = active.filter(item => ['degraded', 'not-configured'].includes(item.operational_status));

  return {
    contract: 'operations.health.v1',
    status: degraded.length ? 'degraded' : 'ready',
    total_services: services.length,
    active_services: active.length,
    degraded_services: degraded.length,
    services
  };
}

module.exports = { buildOperationalHealth };
