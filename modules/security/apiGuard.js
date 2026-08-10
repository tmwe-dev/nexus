const { authorize } = require('./serviceAuth');

function requireScope(req, res, scope) {
  const auth = authorize(req, scope);
  if (!auth.allowed) {
    res.status(403).json({ error: 'Forbidden', reason: auth.reason, required_scope: scope, auth_mode: auth.mode });
    return { ok: false, auth };
  }
  return { ok: true, auth };
}

module.exports = { requireScope };
