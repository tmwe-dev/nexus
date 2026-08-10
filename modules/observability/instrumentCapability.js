const { recordUsage } = require('./ledger');
const { recordEvidence } = require('../migration/evidenceRegistry');

async function instrumentCapability(capability, service, operation, metadata = {}) {
  const started = Date.now();
  try {
    const result = await operation();
    const latency = Date.now() - started;
    recordUsage({
      service,
      capability,
      status: 'ok',
      latency_ms: latency,
      external_calls: Number(metadata.external_calls || 0),
      metadata: { ...metadata, operation: metadata.operation || null }
    });
    recordEvidence({
      capability,
      kind: 'observability',
      accepted: true,
      source: 'nexus-runtime-instrumentation',
      basis: 'successful_instrumented_execution',
      sample_size: 1,
      metadata: { service, latency_ms: latency }
    });
    return result;
  } catch (error) {
    recordUsage({
      service,
      capability,
      status: 'error',
      latency_ms: Date.now() - started,
      external_calls: Number(metadata.external_calls || 0),
      metadata: { ...metadata, error_class: error?.name || 'Error' }
    });
    throw error;
  }
}

module.exports = { instrumentCapability };
