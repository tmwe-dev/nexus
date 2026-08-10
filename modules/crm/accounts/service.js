const { listLegacyContacts } = require('../contacts/legacyNavigatorAdapter');
const { projectAccounts } = require('./projection');
const { linkAccountIdentity } = require('../identity/linkAccount');
const { instrumentCapability } = require('../../observability/instrumentCapability');

function normalizeLimit(value) {
  return Math.max(1, Math.min(Number(value) || 200, 1000));
}

async function searchAccounts(filters = {}) {
  return instrumentCapability('crm.account.search.v1', 'crm', async () => {
    const result = await listLegacyContacts({
      search: filters.search,
      country: filters.country,
      origin: filters.origin,
      lead_status: filters.lead_status,
      wca_match: filters.wca_match,
      limit: normalizeLimit(filters.limit),
      offset: Number(filters.offset) || 0
    });

    const items = projectAccounts(result.rows)
      .map(linkAccountIdentity)
      .sort((a, b) => a.display_name.localeCompare(b.display_name));

    return {
      contract: 'crm.account.search.v1',
      source_mode: 'navigator-read-adapter+identity-resolver',
      items,
      scanned_contacts: result.rows.length,
      source_total_contacts: result.total,
      partial: typeof result.total === 'number' ? result.rows.length < result.total : result.rows.length === normalizeLimit(filters.limit),
      rule: 'Accounts are commercial projections linked to federated company identity; source facts remain source-owned.'
    };
  }, { external_calls: 1, operation: 'searchAccounts' });
}

async function readAccount(id, filters = {}) {
  const payload = await searchAccounts({ ...filters, limit: filters.limit || 1000, offset: 0 });
  return payload.items.find((item) => item.crm_account_id === id || item.identity_company_id === id) || null;
}

module.exports = { searchAccounts, readAccount };
