const { resolveCompany } = require('../../identity/company/resolver');

function accountCandidates(account) {
  const candidates = [];
  for (const ref of account.source_refs || []) {
    if (ref.source === 'wca' && ref.record_type === 'company') {
      candidates.push({
        source: 'wca',
        source_id: ref.source_id,
        wca_partner_id: ref.source_id,
        company_name: account.display_name
      });
    }
    if (ref.source === 'navigator' && ref.record_type === 'account-projection') {
      candidates.push({
        source: 'navigator',
        source_id: ref.source_id,
        company_name: account.display_name
      });
    }
  }
  return candidates;
}

function linkAccountIdentity(account) {
  if (!account) return null;
  const resolution = resolveCompany(accountCandidates(account));
  return {
    ...account,
    identity_company_id: resolution?.identity_company_id || account.identity_company_id,
    identity_confidence: resolution?.confidence ?? account.identity_confidence ?? 0,
    identity_status: resolution?.status || 'provisional',
    identity: resolution,
    migration_projection: resolution?.status !== 'resolved'
  };
}

module.exports = { linkAccountIdentity, accountCandidates };
