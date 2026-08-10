const STATES = new Map();

function now() { return Date.now(); }

function getState(service) {
  if (!STATES.has(service)) {
    STATES.set(service, {
      service,
      state: 'closed',
      failures: 0,
      opened_at: null,
      last_failure_at: null,
      last_success_at: null
    });
  }
  return STATES.get(service);
}

function snapshot(service) { return { ...getState(service) }; }

function shouldAllow(service, options = {}) {
  const state = getState(service);
  const resetTimeoutMs = Math.max(1000, Number(options.reset_timeout_ms) || 30000);
  if (state.state !== 'open') return { allowed: true, state: state.state };
  if (state.opened_at && now() - state.opened_at >= resetTimeoutMs) {
    state.state = 'half-open';
    return { allowed: true, state: 'half-open' };
  }
  return { allowed: false, state: 'open' };
}

function recordSuccess(service) {
  const state = getState(service);
  state.state = 'closed';
  state.failures = 0;
  state.opened_at = null;
  state.last_success_at = new Date().toISOString();
  return snapshot(service);
}

function recordFailure(service, options = {}) {
  const state = getState(service);
  const threshold = Math.max(1, Number(options.failure_threshold) || 3);
  state.failures += 1;
  state.last_failure_at = new Date().toISOString();
  if (state.failures >= threshold) {
    state.state = 'open';
    state.opened_at = now();
  }
  return snapshot(service);
}

async function executeWithCircuit(service, fn, options = {}) {
  const gate = shouldAllow(service, options);
  if (!gate.allowed) {
    return { service, circuit: 'open', executed: false, degraded: true, error: 'CIRCUIT_OPEN' };
  }
  try {
    const result = await fn();
    recordSuccess(service);
    return { service, circuit: snapshot(service).state, executed: true, degraded: false, result };
  } catch (error) {
    const state = recordFailure(service, options);
    return {
      service,
      circuit: state.state,
      executed: true,
      degraded: true,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function listCircuitStates() {
  return Array.from(STATES.values()).map(item => ({ ...item }));
}

module.exports = {
  executeWithCircuit,
  shouldAllow,
  recordSuccess,
  recordFailure,
  snapshot,
  listCircuitStates
};
