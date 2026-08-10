const PROVIDERS = new Map();

function registerProvider(name, handler) {
  if (!name || typeof handler !== 'function') throw new Error('INVALID_PROVIDER');
  PROVIDERS.set(name, handler);
}

async function invokeModel(request = {}) {
  const provider = request.provider || 'default';
  const handler = PROVIDERS.get(provider);
  if (!handler) {
    return {
      contract: 'ai.model.invoke.v1',
      status: 'unavailable',
      provider,
      model: request.model || null,
      degraded: true,
      reason: 'provider_not_configured'
    };
  }
  const startedAt = Date.now();
  const result = await handler(request);
  return {
    contract: 'ai.model.invoke.v1',
    status: 'ok',
    provider,
    model: request.model || result?.model || null,
    latency_ms: Date.now() - startedAt,
    result
  };
}

module.exports = { registerProvider, invokeModel };
