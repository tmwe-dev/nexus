const { recordUsage } = require('../observability/ledger');
const { createTraceContext, traceHeaders } = require('../observability/trace');

function headers(trace) {
  const h = { Accept: 'application/json', 'Content-Type': 'application/json', ...traceHeaders(trace) };
  if (process.env.COBRA_SERVICE_TOKEN) h['X-Cobra-Token'] = process.env.COBRA_SERVICE_TOKEN;
  return h;
}

function buildInstruction(request) {
  const lines = [
    `NEXUS_RESEARCH_REQUEST ${request.request_id}`,
    `Mode: ${request.mode}`,
    `Depth: ${request.depth}`,
    `Query: ${request.query}`
  ];
  if (request.sources.length) lines.push(`Preferred sources: ${request.sources.join(', ')}`);
  if (request.entity_refs.length) lines.push(`Entity refs: ${JSON.stringify(request.entity_refs)}`);
  if (Object.keys(request.constraints || {}).length) lines.push(`Constraints: ${JSON.stringify(request.constraints)}`);
  lines.push('Return findings, source references when available, confidence, gaps, and whether the result is partial. Do not mutate external systems.');
  return lines.join('\n');
}

async function executeWithCobra(request) {
  const trace = createTraceContext({ correlation_id: request.correlation_id || request.request_id });
  const configured = process.env.COBRA_BASE_URL;
  if (!configured) {
    try { recordUsage({ correlation_id: trace.correlation_id, service: 'research-engine', capability: 'research.execute.v1', provider: 'cobra', status: 'unavailable' }); } catch (_) {}
    return { status: 'unavailable', partial: true, warnings: ['COBRA connection not configured'], result: null, correlation_id: trace.correlation_id };
  }

  const controller = new AbortController();
  const timeoutMs = Math.max(5000, Math.min(Number(process.env.COBRA_RESEARCH_TIMEOUT_MS) || 55000, 60000));
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetch(`${configured.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: headers(trace),
      body: JSON.stringify({ message: buildInstruction(request), voiceMode: false }),
      signal: controller.signal
    });
    const payload = await response.json().catch(() => ({}));
    const latency = Date.now() - startedAt;
    if (!response.ok) {
      try { recordUsage({ correlation_id: trace.correlation_id, service: 'research-engine', capability: 'research.execute.v1', provider: 'cobra', status: 'failed', latency_ms: latency, external_calls: 1 }); } catch (_) {}
      return { status: 'failed', partial: true, warnings: [`COBRA returned ${response.status}`], result: null, correlation_id: trace.correlation_id };
    }
    try {
      recordUsage({
        correlation_id: trace.correlation_id,
        service: 'research-engine',
        capability: 'research.execute.v1',
        provider: 'cobra',
        model: payload?.model || null,
        status: 'ok',
        latency_ms: latency,
        external_calls: 1,
        input_units: payload?.promptTokens || 0,
        output_units: payload?.completionTokens || 0,
        cost_amount: payload?.usage?.cost_amount || 0,
        cost_currency: payload?.usage?.cost_currency || 'EUR'
      });
    } catch (_) {}
    return {
      status: 'completed',
      partial: false,
      correlation_id: trace.correlation_id,
      warnings: ['Compatibility mode: COBRA /api/chat; dedicated research endpoint can replace this adapter later'],
      result: payload
    };
  } catch (error) {
    const status = error && error.name === 'AbortError' ? 'partial' : 'failed';
    try { recordUsage({ correlation_id: trace.correlation_id, service: 'research-engine', capability: 'research.execute.v1', provider: 'cobra', status, latency_ms: Date.now() - startedAt, external_calls: 1 }); } catch (_) {}
    if (error && error.name === 'AbortError') return { status: 'partial', partial: true, warnings: ['COBRA research timeout'], result: null, correlation_id: trace.correlation_id };
    return { status: 'failed', partial: true, warnings: ['COBRA unavailable'], result: null, correlation_id: trace.correlation_id };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { executeWithCobra, buildInstruction };
