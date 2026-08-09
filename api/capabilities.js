const { CONNECTIONS } = require('../registry/connections');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const capabilities = CONNECTIONS.flatMap(connection =>
    connection.capabilities.map(name => ({
      name,
      owner: connection.id,
      owner_kind: connection.kind,
      owner_status: connection.status,
      mode: connection.mode
    }))
  ).sort((a, b) => a.name.localeCompare(b.name));

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    service: 'tmwe-nexus',
    total: capabilities.length,
    capabilities
  });
};
