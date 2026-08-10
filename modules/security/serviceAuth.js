const crypto = require('crypto');

function authMode() {
  const mode = String(process.env.NEXUS_AUTH_MODE || 'audit').toLowerCase();
  return ['off','audit','enforce'].includes(mode) ? mode : 'audit';
}

function loadRegistry() {
  try {
    const parsed = JSON.parse(process.env.NEXUS_SERVICE_TOKEN_REGISTRY || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function safeEqualHex(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

function bearerToken(req) {
  const value = req?.headers?.authorization || req?.headers?.Authorization || '';
  const match = String(value).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function verifyServiceRequest(req) {
  const mode = authMode();
  if (mode === 'off') return { mode, authenticated: false, allowed: true, service_id: null, scopes: [] };
  const token = bearerToken(req);
  const registry = loadRegistry();
  if (!token) return { mode, authenticated: false, allowed: mode !== 'enforce', reason: 'missing_bearer_token', service_id: null, scopes: [] };
  const digest = hashToken(token);
  for (const [serviceId, entry] of Object.entries(registry)) {
    const expected = String(entry?.token_sha256 || '');
    if (expected && safeEqualHex(digest, expected)) {
      return { mode, authenticated: true, allowed: true, service_id: serviceId, scopes: Array.isArray(entry.scopes) ? entry.scopes : [] };
    }
  }
  return { mode, authenticated: false, allowed: mode !== 'enforce', reason: 'invalid_bearer_token', service_id: null, scopes: [] };
}

function hasScope(auth, requiredScope) {
  if (!requiredScope) return true;
  if (!auth?.authenticated) return auth?.mode !== 'enforce';
  const scopes = auth.scopes || [];
  return scopes.includes('*') || scopes.includes(requiredScope);
}

function authorize(req, requiredScope) {
  const auth = verifyServiceRequest(req);
  const scopeAllowed = hasScope(auth, requiredScope);
  return { ...auth, required_scope: requiredScope || null, allowed: auth.allowed && scopeAllowed, reason: auth.allowed && !scopeAllowed ? 'scope_denied' : auth.reason || null };
}

module.exports = { authMode, hashToken, verifyServiceRequest, authorize, hasScope };
