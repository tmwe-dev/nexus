const { listLegacyContacts, getLegacyContactById } = require('./legacyNavigatorAdapter');
const { mapLegacyContact } = require('./mapper');

async function searchContacts(filters = {}) {
  const result = await listLegacyContacts(filters);
  return {
    contract: 'crm.contact.search.v1',
    source_mode: 'navigator-read-adapter',
    items: result.rows.map(mapLegacyContact),
    page: {
      limit: result.limit,
      offset: result.offset,
      total: result.total,
      has_more: typeof result.total === 'number'
        ? result.offset + result.rows.length < result.total
        : result.rows.length === result.limit
    }
  };
}

async function readContact(id) {
  const sourceId = String(id || '').replace(/^navigator:/, '');
  const row = await getLegacyContactById(sourceId);
  if (!row) return null;
  return {
    contract: 'crm.contact.read.v1',
    source_mode: 'navigator-read-adapter',
    contact: mapLegacyContact(row)
  };
}

module.exports = { searchContacts, readContact };
