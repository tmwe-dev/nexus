'use strict';

const { authorize } = require('../security/serviceAuth');
const { tokenFrom, user } = require('./legacyAdapter');

async function authorizeEmailRequest(req, scope) {
  const serviceAuth = authorize(req, scope);
  if (serviceAuth.authenticated && serviceAuth.allowed) {
    return { allowed:true, mode:'service', scope, service_auth:serviceAuth, user:null };
  }

  const userToken = tokenFrom(req);
  if (userToken) {
    try {
      const currentUser = await user(req);
      return {
        allowed:true,
        mode:'funnemail-user',
        scope,
        service_auth:serviceAuth,
        user:{ id:currentUser?.id || null, email:currentUser?.email || null }
      };
    } catch (error) {
      if (serviceAuth.mode === 'enforce') {
        return { allowed:false, mode:'funnemail-user', scope, reason:'invalid_funnemail_user_token', service_auth:serviceAuth, error:error.message };
      }
    }
  }

  if (serviceAuth.mode !== 'enforce' && serviceAuth.allowed) {
    return { allowed:true, mode:'audit', scope, service_auth:serviceAuth, user:null };
  }

  return {
    allowed:false,
    mode:serviceAuth.mode,
    scope,
    reason:serviceAuth.reason || 'authentication_required',
    service_auth:serviceAuth,
    user:null
  };
}

async function requireEmailAccess(req, res, scope) {
  const auth = await authorizeEmailRequest(req, scope);
  if (!auth.allowed) {
    res.status(403).json({ error:'Forbidden', reason:auth.reason, required_scope:scope, auth_mode:auth.mode });
    return { ok:false, auth };
  }
  return { ok:true, auth };
}

module.exports = { authorizeEmailRequest, requireEmailAccess };
