const { listLegacyContacts, getLegacyContactById } = require('./legacyNavigatorAdapter');
const { mapLegacyContact } = require('./mapper');
const { linkContactIdentity } = require('../identity/linkContact');
const { instrumentCapability } = require('../../observability/instrumentCapability');
const readRouter = require('../storage/readRouter');

function normalizeContact(row) {
  return row ? linkContactIdentity(mapLegacyContact(row)) : null;
}

async function searchContacts(filters = {}) {
  return instrumentCapability('crm.contact.search.v1', 'crm', async () => {
    const result = await listLegacyContacts(filters);
    return {
      contract: 'crm.contact.search.v1',
      source_mode: 'navigator-read-adapter+identity-resolver',
      items: result.rows.map(normalizeContact),
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
    const routed = await readRouter.read({
      entity: 'contacts',
      id: String(id || ''),
      legacyRead: async () => normalizeContact(await getLegacyContactById(sourceId)),
      compare: (legacy, nexus) => ({
        comparable: Boolean(legacy && nexus),
        same_identity: Boolean(legacy && nexus && String(legacy.identity_contact_id || legacy.crm_contact_id) === String(nexus.identity_contact_id || nexus.crm_contact_id))
      })
    });
    if (!routed.data) return null;
    return {
      contract: 'crm.contact.read.v1',
      source_mode: routed.source === 'nexus' ? 'nexus-independent-store' : (routed.compared ? 'navigator-read-adapter+shadow-nexus' : 'navigator-read-adapter+identity-resolver'),
      contact: routed.data,
      shadow: routed.shadow || undefined
    };
  }, { external_calls: readRouter.mode() === 'nexus' ? 0 : 1, operation: 'readContact' });
}

module.exports = { searchContacts, readContact };
