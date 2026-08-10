const LEAD_STATUSES = new Set([
  'new','first_touch_sent','holding','engaged','qualified','negotiation','converted','archived','blacklisted'
]);

function stringOrNull(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numberOrZero(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0;
}

function mapLegacyContact(row) {
  if (!row || typeof row.id !== 'string') throw new Error('Invalid legacy contact row');
  const leadStatus = LEAD_STATUSES.has(row.lead_status) ? row.lead_status : 'new';

  return {
    contract: 'crm.contact.v1',
    crm_contact_id: `navigator:${row.id}`,
    identity_contact_id: `navigator:contact:${row.id}`,
    identity_company_id: row.wca_partner_id ? `wca:partner:${row.wca_partner_id}` : null,
    lead_status: leadStatus,
    owner_id: stringOrNull(row.operator_id),
    status_reason: stringOrNull(row.status_reason),
    notes: stringOrNull(row.note),
    tags: [],
    interaction_count: numberOrZero(row.interaction_count),
    last_interaction_at: stringOrNull(row.last_interaction_at),
    converted_at: stringOrNull(row.converted_at),
    person: {
      display_name: stringOrNull(row.contact_alias) || stringOrNull(row.name) || stringOrNull(row.email) || '—',
      source_name: stringOrNull(row.name),
      alias: stringOrNull(row.contact_alias),
      position: stringOrNull(row.position),
      email: stringOrNull(row.email),
      phone: stringOrNull(row.phone),
      mobile: stringOrNull(row.mobile)
    },
    company: {
      display_name: stringOrNull(row.company_alias) || stringOrNull(row.company_name),
      source_name: stringOrNull(row.company_name),
      alias: stringOrNull(row.company_alias),
      city: stringOrNull(row.city),
      country: stringOrNull(row.country),
      address: stringOrNull(row.address),
      zip_code: stringOrNull(row.zip_code)
    },
    source_refs: [
      {
        source: 'navigator',
        source_id: row.id,
        record_type: 'contact'
      },
      ...(row.wca_partner_id ? [{ source: 'wca', source_id: row.wca_partner_id, record_type: 'company' }] : [])
    ],
    signals: {
      origin: stringOrNull(row.origin),
      lead_score: typeof row.lead_score === 'number' ? row.lead_score : null,
      deep_search_at: stringOrNull(row.deep_search_at),
      wca_match_confidence: typeof row.wca_match_confidence === 'number' ? row.wca_match_confidence : null
    }
  };
}

module.exports = { mapLegacyContact, LEAD_STATUSES };
