const crypto = require('crypto');
const { getConnection } = require('../../registry/connections');

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length || left.length === 0) return false;
  return crypto.timingSafeEqual(left, right);
}

function expectedTokenFor(serviceId) {
  const connection = getConnection(serviceId);
  if (!connection?.tokenEnv) return null;
  return process.env[connection.tokenEnv] || null;
}

function verifyServiceToken(serviceId, providedToken) {
  const expected = expectedTokenFor(serviceId);
  if (!expected) return { ok: false, reason: 'service_token_not_configured', service_id: serviceId };
  if (!providedToken) return { ok: false, reason: 'service_token_missing', service_id: serviceId };
  return safeEqual(expected, providedToken)
    ? { ok: true, service_id: serviceId }
    : { ok: false, reason: 'service_token_invalid', service_id: serviceId };
}

function serviceHeaders(serviceId, extra = {}) {
  const connection = getConnection(serviceId);
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json', ...extra };
  if (connection?.tokenEnv && process.env[connection.tokenEnv]) headers['X-Nexus-Service-Token'] = process.env[connection.tokenEnv];
  headers['X-Nexus-Service-Id'] = serviceId;
  return headers;
}

function readInboundServiceIdentity(req) {
  const serviceId = String(req.headers?.['x-nexus-service-id'] || '').trim();
  const token = req.headers?.['x-nexus-service-token'];
  if (!serviceId) return { ok: false, reason: 'service_id_missing' };
  return verifyServiceToken(serviceId, token);
}

module.exports = { safeEqual, expectedTokenFor, verifyServiceToken, serviceHeaders, readInboundServiceIdentity };
