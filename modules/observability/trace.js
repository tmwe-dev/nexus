function createTraceContext(input = {}) {
  return {
    contract: 'trace.context.v1',
    correlation_id: input.correlation_id || `corr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    causation_id: input.causation_id || null,
    trace_id: input.trace_id || `trace-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    parent_span_id: input.parent_span_id || null,
    span_id: `span-${Math.random().toString(36).slice(2, 10)}`
  };
}

function traceHeaders(context = {}) {
  const headers = {};
  if (context.correlation_id) headers['X-Correlation-Id'] = context.correlation_id;
  if (context.trace_id) headers['X-Trace-Id'] = context.trace_id;
  if (context.span_id) headers['X-Span-Id'] = context.span_id;
  return headers;
}

module.exports = { createTraceContext, traceHeaders };
