const { authMode } = require('../../modules/security/serviceAuth');
const { SCOPES } = require('../../modules/security/scopes');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(200).json({
    contract: 'security.service-auth-policy.v1',
    mode: authMode(),
    registry_configured: Boolean(process.env.NEXUS_SERVICE_TOKEN_REGISTRY),
    token_storage: 'sha256-only-in-runtime-config',
    scopes: Object.values(SCOPES),
    production_rule: 'NEXUS_AUTH_MODE must be enforce before production cutover.'
  });
};
