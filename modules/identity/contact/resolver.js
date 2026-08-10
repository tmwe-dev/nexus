function clean(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeEmail(value) {
  const v = clean(value);
  return v ? v.toLowerCase() : null;
}

function normalizePhone(value) {
  const v = clean(value);
  return v ? v.replace(/\D/g, '') : null;
}

function normalizeName(value) {
  const v = clean(value);
  return v ? v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ') : null;
}

function candidate(input = {}) {
  return {
    source: clean(input.source),
    source_id: clean(input.source_id),
    email: normalizeEmail(input.email),
    phone: normalizePhone(input.phone || input.mobile),
    name: normalizeName(input.name),
    company_identity_id: clean(input.company_identity_id)
  };
}

function scorePair(a, b) {
  const reasons = [];
  let score = 0;
  if (a.email && b.email && a.email === b.email) { score = 1; reasons.push('email'); }
  if (a.phone && b.phone && a.phone.length >= 8 && a.phone === b.phone) { score = Math.max(score, 0.96); reasons.push('phone'); }
  if (a.name && b.name && a.name === b.name && a.company_identity_id && a.company_identity_id === b.company_identity_id) {
    score = Math.max(score, 0.82);
    reasons.push('name+company');
  }
  return { score, reasons };
}

function stableIdentityId(items) {
  const email = items.find((x) => x.email)?.email;
  if (email) return `contact:email:${email}`;
  const phone = items.find((x) => x.phone)?.phone;
  if (phone) return `contact:phone:${phone}`;
  const first = items[0];
  return `contact:provisional:${encodeURIComponent(`${first?.source || 'unknown'}:${first?.source_id || 'unknown'}`)}`;
}

function resolveContact(inputCandidates = []) {
  const items = inputCandidates.map(candidate).filter((x) => x.source && x.source_id);
  if (!items.length) return null;
  const evidence = [];
  let confidence = items.length === 1 ? 0.4 : 0;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const pair = scorePair(items[i], items[j]);
      if (pair.score > 0) {
        confidence = Math.max(confidence, pair.score);
        evidence.push({ left: `${items[i].source}:${items[i].source_id}`, right: `${items[j].source}:${items[j].source_id}`, ...pair });
      }
    }
  }
  return {
    contract: 'identity.contact.v1',
    identity_contact_id: stableIdentityId(items),
    confidence,
    status: confidence >= 0.95 ? 'resolved' : confidence >= 0.8 ? 'probable' : 'provisional',
    provenance: items.map((x) => ({ source: x.source, source_id: x.source_id })),
    evidence,
    rules: [
      'Email and phone may strongly identify a person; name alone never does.',
      'Identity stores references and evidence, not source-owned contact records.'
    ]
  };
}

module.exports = { resolveContact, scorePair, candidate };
