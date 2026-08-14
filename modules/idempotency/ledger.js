'use strict';

const crypto = require('crypto');

const DEFAULT_CONTROL_PLANE_URL = 'https://rxocvyfhsqduowltmfbp.supabase.co';
const DEFAULT_CONTROL_PLANE_PUBLISHABLE_KEY = 'sb_publishable_hRmtjGfQm21kYj6rPsrX1A_1t64x_Lt';

function normalizeMode(value, fallback = 'audit') {
  const v = String(value || fallback).toLowerCase();
  return v === 'enforce' ? 'enforce' : 'audit';
}

function serviceMode() {
  return normalizeMode(process.env.NEXUS_SERVICE_IDEMPOTENCY_MODE || process.env.NEXUS_IDEMPOTENCY_MODE || 'audit');
}

function userMode() {
  return normalizeMode(process.env.NEXUS_USER_IDEMPOTENCY_MODE || 'enforce', 'enforce');
}

function mode(auth = null) {
  return auth?.mode === 'funnemail-user' ? userMode() : serviceMode();
}

function config() {
  const baseUrl = String(process.env.NEXUS_CONTROL_PLANE_URL || DEFAULT_CONTROL_PLANE_URL).trim().replace(/\/$/, '');
  const serviceKey = String(process.env.NEXUS_CONTROL_PLANE_KEY || '').trim();
  const publishableKey = String(process.env.NEXUS_CONTROL_PLANE_PUBLISHABLE_KEY || DEFAULT_CONTROL_PLANE_PUBLISHABLE_KEY).trim();
  return { baseUrl, serviceKey, publishableKey, userRpcReady:Boolean(baseUrl && publishableKey), serviceRpcReady:Boolean(baseUrl && serviceKey) };
}

function headers(apiKey, bearerToken = apiKey) {
  return {
    apikey: apiKey,
    Authorization: `Bearer ${bearerToken}`,
    'Content-Type': 'application/json'
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
  const payload = canonicalize({ body:req?.body ?? null, query:req?.query ?? null });
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function keyFrom(req) {
  return String(req?.headers?.['idempotency-key'] || req?.headers?.['x-idempotency-key'] || '').trim();
}

function userTokenFrom(req) {
  return String(req?.headers?.['x-funnemail-access-token'] || '').trim();
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

async function rpc(baseUrl, name, body, rpcHeaders) {
  const response = await fetch(`${baseUrl}/rest/v1/rpc/${name}`, {
    method:'POST',
    headers:rpcHeaders,
    body:JSON.stringify(body || {})
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { response, data };
}

function requestPath(req, auth) {
  const cfg = config();
  if (auth?.mode === 'funnemail-user') {
    const token = userTokenFrom(req);
    if (!cfg.userRpcReady || !token) return null;
    return {
      kind:'user',
      cfg,
      headers:headers(cfg.publishableKey, token),
      claimRpc:'nexus_user_idempotency_claim',
      completeRpc:'nexus_user_idempotency_complete'
    };
  }
  if (!cfg.serviceRpcReady) return null;
  return {
    kind:'service',
    cfg,
    headers:headers(cfg.serviceKey),
    claimRpc:'nexus_idempotency_claim',
    completeRpc:'nexus_idempotency_complete'
  };
}

async function probe() {
  const cfg = config();
  if (!cfg.serviceRpcReady) {
    return {
      configured:cfg.userRpcReady,
      reachable:null,
      user_mode:userMode(),
      service_mode:serviceMode(),
      ready:false,
      user_rpc_ready:cfg.userRpcReady,
      service_rpc_ready:false,
      reason:'service_probe_key_not_configured'
    };
  }
  try {
    const { response, data } = await rpc(cfg.baseUrl, 'nexus_idempotency_probe', {}, headers(cfg.serviceKey));
    return {
      configured:true,
      reachable:response.ok,
      user_mode:userMode(),
      service_mode:serviceMode(),
      ready:response.ok && userMode() === 'enforce',
      user_rpc_ready:cfg.userRpcReady,
      service_rpc_ready:true,
      status:response.status,
      stats:Array.isArray(data) ? data[0] || null : data,
      reason:response.ok ? null : `ledger_probe_http_${response.status}`
    };
  } catch (err) {
    return { configured:true, reachable:false, user_mode:userMode(), service_mode:serviceMode(), ready:false, user_rpc_ready:cfg.userRpcReady, service_rpc_ready:true, reason:err.message };
  }
}

async function claim({ req, capability, auth, ttlSeconds, keyOverride }) {
  const currentMode = mode(auth);
  const key = String(keyOverride || keyFrom(req) || '').trim();
  if (!key) {
    if (currentMode === 'enforce') throw error('IDEMPOTENCY_KEY_REQUIRED', 400, 'Idempotency-Key header is required');
    return { execute:true, durable:false, enforced:false, reason:'key_missing', capability };
  }
  if (!validateKey(key)) throw error('IDEMPOTENCY_KEY_INVALID', 400, 'Invalid Idempotency-Key format');

  const path = requestPath(req, auth);
  if (!path) {
    if (currentMode === 'enforce') throw error('IDEMPOTENCY_STORE_UNAVAILABLE', 503, 'Durable idempotency path is not configured for this actor');
    return { execute:true, durable:false, enforced:false, reason:'store_not_configured_for_actor', capability, key };
  }

  const actor = actorKey(auth);
  const hash = requestHash(req);
  const body = path.kind === 'user'
    ? {
        p_capability:capability,
        p_idempotency_key:key,
        p_request_hash:hash,
        p_ttl_seconds:Math.max(60, Math.min(Number(ttlSeconds || process.env.NEXUS_IDEMPOTENCY_TTL_SECONDS) || 86400, 604800))
      }
    : {
        p_capability:capability,
        p_actor_key:actor,
        p_idempotency_key:key,
        p_request_hash:hash,
        p_ttl_seconds:Math.max(60, Math.min(Number(ttlSeconds || process.env.NEXUS_IDEMPOTENCY_TTL_SECONDS) || 86400, 604800))
      };

  const { response, data } = await rpc(path.cfg.baseUrl, path.claimRpc, body, path.headers);
  if (!response.ok) {
    if (currentMode === 'enforce') throw error('IDEMPOTENCY_CLAIM_FAILED', 503, `Idempotency claim failed with ${response.status}`);
    return { execute:true, durable:false, enforced:false, reason:`claim_http_${response.status}`, capability, key };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.decision) throw error('IDEMPOTENCY_CLAIM_INVALID', 503, 'Idempotency claim returned no decision');

  const base = { durable:true, enforced:currentMode === 'enforce', capability, key, actor, request_hash:hash, path:path.kind };
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

async function complete(claimResult, result, responseStatus = 200, req = null, auth = null) {
  if (!claimResult?.durable || !claimResult.execute) return { durable:false };

  const path = requestPath(req, auth) || (() => {
    const cfg = config();
    if (claimResult.path === 'service' && cfg.serviceRpcReady) return { kind:'service', cfg, headers:headers(cfg.serviceKey), completeRpc:'nexus_idempotency_complete' };
    return null;
  })();
  if (!path) throw error('IDEMPOTENCY_COMMIT_FAILED', 503, 'Idempotency store disappeared after execution', { operation_may_have_completed:true });

  const body = path.kind === 'user'
    ? {
        p_capability:claimResult.capability,
        p_idempotency_key:claimResult.key,
        p_request_hash:claimResult.request_hash,
        p_result_ref:inferResultRef(result),
        p_response_status:responseStatus
      }
    : {
        p_capability:claimResult.capability,
        p_actor_key:claimResult.actor,
        p_idempotency_key:claimResult.key,
        p_request_hash:claimResult.request_hash,
        p_result_ref:inferResultRef(result),
        p_response_status:responseStatus
      };

  const { response, data } = await rpc(path.cfg.baseUrl, path.completeRpc, body, path.headers);
  const completed = data === true || (Array.isArray(data) && data[0] === true);
  if (!response.ok || !completed) {
    throw error('IDEMPOTENCY_COMMIT_FAILED', 503, `Idempotency completion failed with ${response.status}`, {
      operation_may_have_completed:true,
      idempotency_key:claimResult.key
    });
  }
  return { durable:true };
}

async function run({ req, capability, auth, responseStatus = 200, ttlSeconds, keyOverride }, operation) {
  const ticket = await claim({ req, capability, auth, ttlSeconds, keyOverride });
  if (ticket.replayed) return { replayed:true, ticket, result:null };
  const result = await operation();
  await complete(ticket, result, responseStatus, req, auth);
  return { replayed:false, ticket, result };
}

function readiness() {
  const cfg = config();
  return {
    user_mode:userMode(),
    service_mode:serviceMode(),
    user_durable_store_configured:cfg.userRpcReady,
    service_durable_store_configured:cfg.serviceRpcReady,
    ready_for_funnemail:userMode() === 'enforce' && cfg.userRpcReady,
    ready_for_service_workflows:serviceMode() === 'enforce' && cfg.serviceRpcReady
  };
}

module.exports = { mode, userMode, serviceMode, config, probe, requestHash, keyFrom, actorKey, claim, complete, run, readiness, inferResultRef };
