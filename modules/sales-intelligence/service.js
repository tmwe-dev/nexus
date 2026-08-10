const { searchAccounts } = require('../crm/accounts/service');
const { rankAccounts } = require('./ranking');
const { recommendNextAction } = require('./recommendations');

async function getSalesPriorities(filters = {}) {
  const accountsPayload = await searchAccounts(filters);
  const byId = new Map((accountsPayload.items || []).map((a) => [a.crm_account_id, a]));
  const ranking = rankAccounts(accountsPayload.items || []).map((item) => {
    const account = byId.get(item.crm_account_id) || {};
    return {
      ...item,
      display_name: account.display_name || null,
      lead_status: account.lead_status || null,
      recommendation: recommendNextAction(account, item)
    };
  });

  return {
    contract: 'sales.intelligence.priorities.v1',
    source_mode: accountsPayload.source_mode,
    partial: Boolean(accountsPayload.partial),
    items: ranking,
    rules: [
      'Ranking never changes CRM state.',
      'Recommendations are advisory only.',
      'Missing external research must not block CRM ranking.'
    ]
  };
}

module.exports = { getSalesPriorities };
