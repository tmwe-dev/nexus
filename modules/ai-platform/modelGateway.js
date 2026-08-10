const { recordUsage } = require('../observability/ledger');
const { createTraceContext } = require('../observability/trace');

const PROVIDERS = new Map();

function registerProvider(name, handler) {
  if (!name || typeof handler !== 'function') throw new Error('INVALID_PROVIDER');
  PROVIDERS.set(name, handler);
}

async function invokeModel(request = {}) {
  const provider = request.provider || 'default';
  const handler = PROVIDERS.get(provider);
  const trace = createTraceContext(request);

  if (!handler) {
    try {
      recordUsage({ correlation_id: trace.correlation_id, service: 'ai-platform', capability: 'ai.model.invoke.v1', provider, model: request.model || null, status: 'unavailable' });
    } catch (_) {}
    return {
      contract: 'ai.model.invoke.v1',
      status: 'unavailable',
      provider,
      model: request.model || null,
      degraded: true,
      reason: 'provider_not_configured',
      correlation_id: trace.correlation_id
    };
  }

  const startedAt = Date.now();
  try {
    const result = await handler({ ...request, correlation_id: trace.correlation_id, trace_id: trace.trace_id });
    const latency = Date.now() - startedAt;
    try {
      recordUsage({
        correlation_id: trace.correlation_id,
        service: 'ai-platform',
        capability: 'ai.model.invoke.v1',
        provider,
        model: request.model || result?.model || null,
        status: 'ok',
        latency_ms: latency,
        input_units: result?.usage?.input_tokens || result?.promptTokens || 0,
        output_units: result?.usage?.output_tokens || result?.completionTokens || 0,
        external_calls: 1,
        cost_amount: result?.usage?.cost_amount || 0,
        cost_currency: result?.usage?.cost_currency || 'EUR'
      });
    } catch (_) {}
    return {
      contract: 'ai.model.invoke.v1',
      status: 'ok',
      provider,
      model: request.model || result?.model || null,
      latency_ms: latency,
      correlation_id: trace.correlation_id,
      result
    };
  } catch (error) {
    try {
      recordUsage({ correlation_id: trace.correlation_id, service: 'ai-platform', capability: 'ai.model.invoke.v1', provider, model: request.model || null, status: 'failed', latency_ms: Date.now() - startedAt, external_calls: 1 });
    } catch (_) {}
    throw error;
  }
}

module.exports = { registerProvider, invokeModel };
