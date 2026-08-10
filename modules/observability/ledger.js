const ENTRIES = [];

function normalizeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function recordUsage(entry = {}) {
  const normalized = Object.freeze({
    contract: 'usage.entry.v1',
    usage_id: entry.usage_id || `usage-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    occurred_at: entry.occurred_at || new Date().toISOString(),
    correlation_id: entry.correlation_id || null,
    causation_id: entry.causation_id || null,
    service: entry.service || 'unknown',
    capability: entry.capability || null,
    provider: entry.provider || null,
    model: entry.model || null,
    status: entry.status || 'ok',
    latency_ms: normalizeNumber(entry.latency_ms),
    input_units: normalizeNumber(entry.input_units),
    output_units: normalizeNumber(entry.output_units),
    external_calls: normalizeNumber(entry.external_calls),
    cost_amount: normalizeNumber(entry.cost_amount),
    cost_currency: entry.cost_currency || 'EUR',
    metadata: entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {}
  });
  ENTRIES.push(normalized);
  return normalized;
}

function listUsage({ correlation_id, service, limit = 100 } = {}) {
  const max = Math.max(1, Math.min(Number(limit) || 100, 1000));
  return ENTRIES.filter(item => {
    if (correlation_id && item.correlation_id !== correlation_id) return false;
    if (service && item.service !== service) return false;
    return true;
  }).slice(-max).reverse();
}

function summarizeUsage(filters = {}) {
  const items = listUsage({ ...filters, limit: 1000 });
  return items.reduce((acc, item) => {
    acc.calls += 1;
    acc.latency_ms += item.latency_ms;
    acc.input_units += item.input_units;
    acc.output_units += item.output_units;
    acc.external_calls += item.external_calls;
    acc.cost_amount += item.cost_amount;
    return acc;
  }, { calls: 0, latency_ms: 0, input_units: 0, output_units: 0, external_calls: 0, cost_amount: 0, cost_currency: 'EUR' });
}

module.exports = { recordUsage, listUsage, summarizeUsage };
