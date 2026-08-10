const { searchAccounts } = require('../accounts/service');
const { instrumentCapability } = require('../../observability/instrumentCapability');

const OPPORTUNITY_STAGES = new Set(['qualified','negotiation','converted']);

function projectOpportunity(account) {
  if (!account || !OPPORTUNITY_STAGES.has(account.lead_status)) return null;
  return {
    contract: 'crm.opportunity.v1',
    opportunity_id: `opportunity:${account.crm_account_id}`,
    crm_account_id: account.crm_account_id,
    identity_company_id: account.identity_company_id || null,
    stage: account.lead_status,
    owner_id: account.owner_id || null,
    lead_score: account.lead_score ?? null,
    contacts_count: account.contacts_count || 0,
    interaction_count: account.interaction_count || 0,
    last_interaction_at: account.last_interaction_at || null,
    source_refs: account.source_refs || [],
    projection: true,
    read_only: true
  };
}

async function searchOpportunities(filters = {}) {
  return instrumentCapability('crm.opportunity.search.v1', 'crm', async () => {
    const accounts = await searchAccounts(filters);
    const items = accounts.items.map(projectOpportunity).filter(Boolean);
    return {
      contract: 'crm.opportunity.search.v1',
      source_mode: accounts.source_mode,
      items,
      partial: accounts.partial,
      rule: 'During migration, opportunities are read-only projections of qualified/negotiation/converted CRM accounts.'
    };
  }, { external_calls: 1, operation: 'searchOpportunities' });
}

module.exports = { OPPORTUNITY_STAGES, projectOpportunity, searchOpportunities };
