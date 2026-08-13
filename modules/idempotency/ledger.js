'use strict';

const crypto = require('crypto');

function mode() {
  const value = String(process.env.NEXUS_IDEMPOTENCY_MODE || 'audit').toLowerCase();
  return value === 'enforce' ? 'enforce' : 'audit';
}

function config() {
  const baseUrl = String(process.env.NEXUS_CONTROL_PLANE_URL || '').trim().replace(/\/$/, '');
  const apiKey = String(process.env.NEXUS_CONTROL_PLANE_KEY || '').trim();
  return baseUrl && apiKey ? { baseUrl, apiKey } : null;
}

function headers(apiKey, prefer = 'return=representation') {
  return {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    Prefer: prefer
  };
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((out, key) => {
      if (value[key] !== undefined) out[key] = canonicalize(value[key]);
      return out;
    }, {});
  }
  return value === undefined ? null : value;
}

function requestHash(req) {
  const payload = canonicalize({ body: req?.body ?? null, query: req?.query ?? null });
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function keyFrom(req) {
  return String(req?.headers?.['idempotency-key'] || req?.headers?.['x-idempotency-key'] || '').trim();
}

function validateKey(key) {
  return /^[A-Za-z0-9._:-]{8,200}$/.test(key);
}

function actorKey(auth) {
  if (auth?.mode === 'funnemail-user') return `user:${auth.user?.id || 'unknown'}`;
  if (auth?.mode === 'service') return `service:${auth.service_auth?.service_id || 'unknown'}`;
  if (auth?.service_id) return `service:${auth.service_id}`;
  return 'audit:anonymous';
}

function error(code, status, message, details = {}) {
  const err = new Error(message || code);
  err.code = code;
  err.status = status;
  err.details = details;
  return err;
}

async function claim({ req, capability, auth, ttlSeconds, keyOverride }) {
  const currentMode = mode();
  const key = String(keyOverride || keyFrom(req) || '').trim();
  if (!key) {
    if (currentMode === 'enforce') throw error('IDEMPOTENCY_KEY_REQUIRED', 400, 'Idempotency-Key header is required');
    return { execute:true, durable:false, enforced:false, reason:'key_missing', capability };
  }
  if (!validateKey(key)) throw error('IDEMPOTENCY_KEY_INVALID', 400, 'Invalid Idempotency-Key format');

  const cfg = config();
  if (!cfg) {
    if (currentMode === 'enforce') throw error('IDEMPOTENCY_STORE_UNAVAILABLE', 503, 'Durable idempotency store is not configured');
    return { execute:true, durable:false, enforced:false, reason:'store_not_configured', capability, key };
  }

  const actor = actorKey(auth);
  const hash = requestHash(req);
  const response = await fetch(`${cfg.baseUrl}/rest/v1/rpc/nexus_idempotency_claim`, {
    method: 'POST',
    headers: headers(cfg.apiKey),
    body: JSON.stringify({
      p_capability: capability,
      p_actor_key: actor,
      p_idempotency_key: key,
      p_request_hash: hash,
      p_ttl_seconds: Math.max(60, Math.min(Number(ttlSeconds || process.env.NEXUS_IDEMPOTENCY_TTL_SECONDS) || 86400, 604800))
    })
  });

  if (!response.ok) {
    if (currentMode === 'enforce') throw error('IDEMPOTENCY_CLAIM_FAILED', 503, `Idempotency claim failed with ${response.status}`);
    return { execute:true, durable:false, enforced:false, reason:`claim_http_${response.status}`, capability, key };
  }

  const rows = await response.json();
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row?.decision) throw error('IDEMPOTENCY_CLAIM_INVALID', 503, 'Idempotency claim returned no decision');

  const base = { durable:true, enforced:currentMode === 'enforce', capability, key, actor, request_hash:hash };
  if (row.decision === 'execute') return { ...base, execute:true, replayed:false };
  if (row.decision === 'replay') return { ...base, execute:false, replayed:true, result_ref:row.current_result_ref || null, response_status:row.current_response_status || 200 };
  if (row.decision === 'conflict') throw error('IDEMPOTENCY_KEY_CONFLICT', 409, 'Idempotency key was already used with a different request');
  if (row.decision === 'in_progress') throw error('IDEMPOTENCY_IN_PROGRESS', 409, 'An operation with this idempotency key is already pending or has an unknown outcome');
  throw error('IDEMPOTENCY_DECISION_UNKNOWN', 503, `Unknown idempotency decision: ${row.decision}`);
}

function inferResultRef(result) {
  const value = Array.isArray(result) ? result[0] : result;
  if (!value || typeof value !== 'object') return null;
  const direct = value.id || value.message_id || value.draft_id || value.task_id || value.request_id || value.operation_id;
  if (direct !== undefined && direct !== null) return String(direct).slice(0, 500);
  if (value.data && typeof value.data === 'object') return inferResultRef(value.data);
  return null;
}

async function complete(claimResult, result, responseStatus = 200) {
  if (!claimResult?.durable || !claimResult.execute) return { durable:false };
  const cfg = config();
  if (!cfg) throw error('IDEMPOTENCY_COMMIT_FAILED', 503, 'Idempotency store disappeared after execution', { operation_may_have_completed:true });

  const params = new URLSearchParams({
    capability: `eq.${claimResult.capability}`,
    actor_key: `eq.${claimResult.actor}`,
    idempotency_key: `eq.${claimResult.key}`,
    request_hash: `eq.${claimResult.request_hash}`
  });
  const response = await fetch(`${cfg.baseUrl}/rest/v1/idempotency_ledger?${params.toString()}`, {
    method: 'PATCH',
    headers: headers(cfg.apiKey, 'return=minimal'),
    body: JSON.stringify({
      state:'completed',
      result_ref:inferResultRef(result),
      response_status:responseStatus,
      updated_at:new Date().toISOString()
    })
  });
  if (!response.ok) throw error('IDEMPOTENCY_COMMIT_FAILED', 503, `Idempotency completion failed with ${response.status}`, { operation_may_have_completed:true, idempotency_key:claimResult.key });
  return { durable:true };
}

async function run({ req, capability, auth, responseStatus = 200, ttlSeconds, keyOverride }, operation) {
  const ticket = await claim({ req, capability, auth, ttlSeconds, keyOverride });
  if (ticket.replayed) return { replayed:true, ticket, result:null };
  const result = await operation();
  await complete(ticket, result, responseStatus);
  return { replayed:false, ticket, result };
}

function readiness() {
  return { mode:mode(), durable_store_configured:Boolean(config()), ready:mode() === 'enforce' && Boolean(config()) };
}

module.exports = { mode, config, requestHash, keyFrom, actorKey, claim, complete, run, readiness, inferResultRef };
