const { deriveSignals } = require('./signals');

function rankAccount(account = {}) {
  const base = Number(account.lead_score) || 0;
  const signals = deriveSignals(account);
  const adjustment = signals.reduce((sum, s) => sum + s.weight, 0);
  const score = Math.max(0, Math.min(100, base + adjustment));
  const priority = score >= 80 ? 'critical' : score >= 65 ? 'high' : score >= 45 ? 'medium' : 'low';
  return {
    contract: 'sales.ranking.v1',
    crm_account_id: account.crm_account_id,
    identity_company_id: account.identity_company_id || null,
    score,
    priority,
    base_lead_score: base,
    adjustment,
    signals
  };
}

function rankAccounts(accounts = []) {
  return accounts.map(rankAccount).sort((a, b) => b.score - a.score);
}

module.exports = { rankAccount, rankAccounts };
