const { listConnectionStates } = require('../connections/controlPlane');
const { listCircuitStates } = require('../resilience/circuitBreaker');

function buildOperationalHealth() {
  const circuits = new Map(listCircuitStates().map(item => [item.service, item]));
  const services = listConnectionStates().map(connection => {
    const circuit = circuits.get(connection.id) || null;
    let status = 'ready';
    if (connection.id === 'tmwe2') status = 'excluded';
    else if (connection.deferred) status = 'deferred';
    else if (!connection.configured) status = 'not-configured';
    else if (circuit?.state === 'open') status = 'degraded';
    return { ...connection, operational_status: status, circuit_state: circuit?.state || 'closed' };
  });

  const active = services.filter(item => !['excluded', 'deferred'].includes(item.operational_status));
  const degraded = active.filter(item => ['degraded', 'not-configured'].includes(item.operational_status));

  return {
    contract: 'operations.health.v2',
    status: degraded.length ? 'degraded' : 'ready',
    total_services: services.length,
    active_services: active.length,
    degraded_services: degraded.length,
    services
  };
}

module.exports = { buildOperationalHealth };
