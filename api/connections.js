const { connectionSummary, readConnectionState } = require('../modules/connections/controlPlane');
const { requireScope } = require('../modules/security/apiGuard');
const { SCOPES } = require('../modules/security/scopes');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const guard = requireScope(req, res, SCOPES.OPERATIONS_READ);
  if (!guard.ok) return;
  res.setHeader('Cache-Control', 'no-store');
  const id = String(req.query?.id || '').trim();
  if (id) {
    const item = readConnectionState(id);
    return item ? res.status(200).json({ contract: 'connection.state.v1', item }) : res.status(404).json({ error: 'Connection not found' });
  }
  return res.status(200).json(connectionSummary());
};
