'use strict';

const REQUIRED = {
  FUNNEMAIL: ['email:read','email:send','email:sync'],
  BARTALK: ['communication:session','communication:handoff']
};

function evaluate(service, probe, declaredCapabilities = []) {
  const required = REQUIRED[service] || [];
  const declared = new Set(declaredCapabilities);
  const missing = required.filter(c => !declared.has(c));
  const checks = {
    configured: Boolean(probe?.configured),
    reachable: Boolean(probe?.reachable),
    capabilities_complete: missing.length === 0
  };
  const score = Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100);
  return { service, score, conformant: score === 100, checks, missing_capabilities: missing };
}

module.exports = { evaluate, REQUIRED };
