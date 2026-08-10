const { listLegacyContacts } = require('../contacts/legacyNavigatorAdapter');
const { projectAccounts } = require('./projection');

function normalizeLimit(value) {
  return Math.max(1, Math.min(Number(value) || 200, 1000));
}

async function searchAccounts(filters = {}) {
  const result = await listLegacyContacts({
    search: filters.search,
    country: filters.country,
    origin: filters.origin,
    lead_status: filters.lead_status,
    wca_match: filters.wca_match,
    limit: normalizeLimit(filters.limit),
    offset: Number(filters.offset) || 0
  });

  const items = projectAccounts(result.rows).sort((a, b) => a.display_name.localeCompare(b.display_name));
  return {
    contract: 'crm.account.search.v1',
    source_mode: 'navigator-read-adapter',
    items,
    scanned_contacts: result.rows.length,
    source_total_contacts: result.total,
    partial: typeof result.total === 'number' ? result.rows.length < result.total : result.rows.length === normalizeLimit(filters.limit),
    rule: 'Accounts are commercial projections. Company master data must be resolved through Nexus Identity/source connectors.'
  };
}

async function readAccount(id, filters = {}) {
  const payload = await searchAccounts({ ...filters, limit: filters.limit || 1000, offset: 0 });
  return payload.items.find((item) => item.crm_account_id === id) || null;
}

module.exports = { searchAccounts, readAccount };
