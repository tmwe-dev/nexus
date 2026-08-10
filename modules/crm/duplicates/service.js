const { listLegacyContacts } = require('../contacts/legacyNavigatorAdapter');
const { groupDuplicates } = require('./preview');

async function previewDuplicates(filters = {}) {
  const result = await listLegacyContacts({ ...filters, limit: Math.min(Number(filters.limit) || 500, 1000), offset: 0 });
  const preview = groupDuplicates(result.rows);
  return {
    ...preview,
    source_mode: 'navigator-read-adapter',
    scanned: result.rows.length,
    total_available: result.total
  };
}

module.exports = { previewDuplicates };
