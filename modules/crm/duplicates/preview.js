function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizePhone(value) {
  return typeof value === 'string' ? value.replace(/\D/g, '') : '';
}

function normalizeCompany(value) {
  return typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, ' ') : '';
}

function groupDuplicates(rows = []) {
  const groups = [];
  const seen = new Set();

  const pushGroups = (map, reason, minLength = 1) => {
    for (const [key, items] of map.entries()) {
      if (!key || key.length < minLength || items.length < 2) continue;
      const ids = items.map((x) => x.id).sort().join(':');
      if (seen.has(ids)) continue;
      seen.add(ids);
      groups.push({ reason, match_key: key, confidence: reason === 'email' ? 1 : reason === 'phone' ? 0.95 : 0.6, items });
    }
  };

  const byEmail = new Map();
  const byPhone = new Map();
  const byCompany = new Map();

  for (const row of rows) {
    const email = normalizeEmail(row.email);
    const phone = normalizePhone(row.phone || row.mobile);
    const company = normalizeCompany(row.company_name);
    if (email) byEmail.set(email, [...(byEmail.get(email) || []), row]);
    if (phone.length >= 8) byPhone.set(phone, [...(byPhone.get(phone) || []), row]);
    if (company) byCompany.set(company, [...(byCompany.get(company) || []), row]);
  }

  pushGroups(byEmail, 'email');
  pushGroups(byPhone, 'phone', 8);
  pushGroups(byCompany, 'company_name');

  return {
    contract: 'crm.duplicate.merge.preview.v1',
    destructive: false,
    groups,
    rules: [
      'Preview never merges or deletes records.',
      'Company-name-only matches are suggestions, not identity proof.',
      'Cross-source entity resolution belongs to Nexus Identity.'
    ]
  };
}

module.exports = { groupDuplicates };
