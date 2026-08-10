const { listLegacyContacts, getLegacyContactById } = require('./legacyNavigatorAdapter');
const { mapLegacyContact } = require('./mapper');
const { linkContactIdentity } = require('../identity/linkContact');
const { instrumentCapability } = require('../../observability/instrumentCapability');

async function searchContacts(filters = {}) {
  return instrumentCapability('crm.contact.search.v1', 'crm', async () => {
    const result = await listLegacyContacts(filters);
    return {
      contract: 'crm.contact.search.v1',
      source_mode: 'navigator-read-adapter+identity-resolver',
      items: result.rows.map(mapLegacyContact).map(linkContactIdentity),
      page: {
        limit: result.limit,
        offset: result.offset,
        total: result.total,
        has_more: typeof result.total === 'number'
          ? result.offset + result.rows.length < result.total
          : result.rows.length === result.limit
      }
    };
  }, { external_calls: 1, operation: 'searchContacts' });
}

async function readContact(id) {
  return instrumentCapability('crm.contact.read.v1', 'crm', async () => {
    const sourceId = String(id || '').replace(/^navigator:/, '');
    const row = await getLegacyContactById(sourceId);
    if (!row) return null;
    return {
      contract: 'crm.contact.read.v1',
      source_mode: 'navigator-read-adapter+identity-resolver',
      contact: linkContactIdentity(mapLegacyContact(row))
    };
  }, { external_calls: 1, operation: 'readContact' });
}

module.exports = { searchContacts, readContact };
