'use strict';

const { authorize } = require('../security/serviceAuth');
const { tokenFrom } = require('./legacyAdapter');
const service = require('./serviceClient');

async function boundaryUser(req) {
  if (!service.configured()) {
    const error = new Error('funnemail_service_boundary_not_configured');
    error.status = 503;
    throw error;
  }
  const payload = await service.request(req, '/auth/user');
  return payload?.user || payload;
}

async function authorizeEmailRequest(req, scope) {
  const serviceAuth = authorize(req, scope);
  if (serviceAuth.authenticated && serviceAuth.allowed) {
    return { allowed:true, mode:'service', scope, service_auth:serviceAuth, user:null };
  }

  const userToken = tokenFrom(req);
  if (userToken) {
    try {
      const currentUser = await boundaryUser(req);
      if (!currentUser?.id) throw new Error('funnemail_user_identity_missing');
      return {
        allowed:true,
        mode:'funnemail-user',
        scope,
        service_auth:serviceAuth,
        user:{ id:currentUser.id, email:currentUser.email || null }
      };
    } catch (error) {
      return {
        allowed:false,
        mode:'funnemail-user',
        scope,
        reason:'invalid_or_unavailable_funnemail_user_token',
        service_auth:serviceAuth,
        error:error.message
      };
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
    res.status(auth.mode === 'funnemail-user' ? 401 : 403).json({ error:'Forbidden', reason:auth.reason, required_scope:scope, auth_mode:auth.mode });
    return { ok:false, auth };
  }
  return { ok:true, auth };
}

module.exports = { authorizeEmailRequest, requireEmailAccess, boundaryUser };
