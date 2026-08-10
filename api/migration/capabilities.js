const { listCapabilityMigrations, getCapabilityMigration } = require('../../modules/migration/capabilityMap');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const capability = String(req.query.capability || '').trim();
  if (capability) {
    const item = getCapabilityMigration(capability);
    return item ? res.status(200).json(item) : res.status(404).json({ error: 'Capability not found' });
  }
  return res.status(200).json({ contract: 'migration.capability-map.v1', items: listCapabilityMigrations() });
};
