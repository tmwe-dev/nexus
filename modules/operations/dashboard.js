const { CONNECTIONS, publicConnection } = require('../../registry/connections');
let resilience = null;
try { resilience = require('../resilience/matrix'); } catch (_) {}
let observability = null;
try { observability = require('../observability/ledger'); } catch (_) {}

function operationalDashboard() {
  const connections = CONNECTIONS.map(publicConnection);
  const configured = connections.filter(item => item.configured).length;
  const total = connections.length;
  const usageSummary = observability?.summarizeUsage ? observability.summarizeUsage({}) : null;
  return {
    contract: 'operations.dashboard.v1',
    generated_at: new Date().toISOString(),
    services: { total, configured, unconfigured: total - configured, items: connections },
    usage: usageSummary,
    resilience: resilience?.getDegradationMatrix ? resilience.getDegradationMatrix() : null,
    source_systems_mutated: false
  };
}

module.exports = { operationalDashboard };