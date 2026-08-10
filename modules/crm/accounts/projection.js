function clean(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function domainFromEmail(email) {
  const value = clean(email);
  if (!value || !value.includes('@')) return null;
  return value.split('@')[1]?.toLowerCase() || null;
}

function accountKey(row) {
  if (row.wca_partner_id) return { key: `wca:${row.wca_partner_id}`, identity_company_id: `wca:partner:${row.wca_partner_id}`, confidence: 1 };
  const name = clean(row.company_alias) || clean(row.company_name);
  if (name) return { key: `name:${name.toLowerCase()}`, identity_company_id: null, confidence: 0.6 };
  const domain = domainFromEmail(row.email);
  if (domain) return { key: `domain:${domain}`, identity_company_id: null, confidence: 0.5 };
  return { key: `contact:${row.id}`, identity_company_id: null, confidence: 0 };
}

function mostAdvancedStatus(rows) {
  const order = ['converted','negotiation','qualified','engaged','holding','first_touch_sent','new','archived','blacklisted'];
  for (const status of order) if (rows.some((row) => row.lead_status === status)) return status;
  return null;
}

function latestIso(rows, field) {
  return rows.map((row) => clean(row[field])).filter(Boolean).sort().reverse()[0] || null;
}

function projectAccounts(rows = []) {
  const groups = new Map();
  for (const row of rows) {
    if (!row || !row.id) continue;
    const identity = accountKey(row);
    const group = groups.get(identity.key) || { identity, rows: [] };
    group.rows.push(row);
    groups.set(identity.key, group);
  }

  return Array.from(groups.entries()).map(([key, group]) => {
    const first = group.rows[0];
    const displayName = clean(first.company_alias) || clean(first.company_name) || domainFromEmail(first.email) || 'Senza azienda';
    const scores = group.rows.map((row) => Number(row.lead_score)).filter(Number.isFinite);
    const wcaRefs = [...new Set(group.rows.map((row) => clean(row.wca_partner_id)).filter(Boolean))];

    return {
      contract: 'crm.account.v1',
      crm_account_id: `navigator-account:${encodeURIComponent(key)}`,
      identity_company_id: group.identity.identity_company_id,
      identity_confidence: group.identity.confidence,
      display_name: displayName,
      owner_id: clean(first.operator_id),
      lead_status: mostAdvancedStatus(group.rows),
      contacts_count: group.rows.length,
      interaction_count: group.rows.reduce((sum, row) => sum + (Number(row.interaction_count) || 0), 0),
      last_interaction_at: latestIso(group.rows, 'last_interaction_at'),
      lead_score: scores.length ? Math.max(...scores) : null,
      source_refs: [
        { source: 'navigator', record_type: 'account-projection', source_id: key },
        ...wcaRefs.map((id) => ({ source: 'wca', record_type: 'company', source_id: id }))
      ],
      contact_refs: group.rows.map((row) => ({ crm_contact_id: `navigator:${row.id}`, source_id: row.id })),
      migration_projection: !group.identity.identity_company_id,
      projection_rule: group.identity.identity_company_id ? 'wca_partner_id' : key.startsWith('name:') ? 'company_name' : key.startsWith('domain:') ? 'email_domain' : 'single_contact'
    };
  });
}

module.exports = { projectAccounts, accountKey };
