const { normalizeName, normalizeDomain, normalizeVat, clean } = require('./normalizers');

function candidate({ source, source_id, company_name, email, domain, vat, country, wca_partner_id }) {
  return {
    source,
    source_id,
    company_name: clean(company_name),
    normalized_name: normalizeName(company_name),
    domain: normalizeDomain(domain || email),
    vat: normalizeVat(vat),
    country: clean(country),
    wca_partner_id: clean(wca_partner_id)
  };
}

function scorePair(a, b) {
  const reasons = [];
  let score = 0;

  if (a.wca_partner_id && b.wca_partner_id && a.wca_partner_id === b.wca_partner_id) {
    score = Math.max(score, 1);
    reasons.push('wca_partner_id');
  }
  if (a.vat && b.vat && a.vat === b.vat) {
    score = Math.max(score, 0.99);
    reasons.push('vat');
  }
  if (a.domain && b.domain && a.domain === b.domain) {
    score = Math.max(score, 0.9);
    reasons.push('domain');
  }
  if (a.normalized_name && b.normalized_name && a.normalized_name === b.normalized_name) {
    const countryCompatible = !a.country || !b.country || a.country.toLowerCase() === b.country.toLowerCase();
    score = Math.max(score, countryCompatible ? 0.72 : 0.55);
    reasons.push(countryCompatible ? 'name+country-compatible' : 'name-only-country-conflict');
  }

  return { score, reasons };
}

function stableIdentityId(items) {
  const wca = items.find((x) => x.wca_partner_id)?.wca_partner_id;
  if (wca) return `company:wca:${wca}`;
  const vat = items.find((x) => x.vat)?.vat;
  if (vat) return `company:vat:${vat}`;
  const domain = items.find((x) => x.domain)?.domain;
  if (domain) return `company:domain:${domain}`;
  const name = items.find((x) => x.normalized_name)?.normalized_name;
  return `company:provisional:${encodeURIComponent(name || items[0]?.source_id || 'unknown')}`;
}

function resolveCompany(inputCandidates = []) {
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

  const authoritative = items.some((x) => x.wca_partner_id || x.vat);
  return {
    contract: 'identity.company.v1',
    identity_company_id: stableIdentityId(items),
    confidence,
    status: authoritative && confidence >= 0.9 ? 'resolved' : confidence >= 0.7 ? 'probable' : 'provisional',
    provenance: items.map((x) => ({ source: x.source, source_id: x.source_id })),
    evidence,
    rules: [
      'Identity stores references and match evidence, not authoritative source records.',
      'Name-only equality is never authoritative identity proof.',
      'Source systems remain owners of their factual data.'
    ]
  };
}

module.exports = { resolveCompany, scorePair, candidate };
