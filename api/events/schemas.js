const { ensureInitialEventSchemas } = require('../../modules/events/catalog');
const { listEventSchemas } = require('../../modules/events/registry');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  ensureInitialEventSchemas();
  return res.status(200).json({
    contract: 'event.schemas.v1',
    schemas: listEventSchemas(),
    rules: [
      'Event names are immutable once published.',
      'Breaking payload changes require a new major event version.',
      'Consumers opt into the versions they support.'
    ]
  });
};
