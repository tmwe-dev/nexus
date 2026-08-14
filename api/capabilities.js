'use strict';

const { CAPABILITIES, responseContract } = require('../registry/capabilities');
const { getConnection } = require('../registry/connections');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const capabilities = CAPABILITIES.map(capability => {
    const owner = getConnection(capability.owner);
    return {
      name: capability.name,
      capability_contract: capability.name,
      response_contract: responseContract(capability),
      owner: capability.owner,
      owner_kind: owner?.kind || null,
      owner_status: owner?.status || null,
      mode: owner?.mode || null,
      route: capability.route,
      method: capability.method,
      scope: capability.scope,
      status: capability.status,
      side_effects: capability.side_effects,
      idempotency_required: capability.idempotency_required,
      implemented: Boolean(capability.route)
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ service:'tmwe-nexus', contract:'capabilities.registry.v2', registry:'canonical', total:capabilities.length, capabilities });
};
