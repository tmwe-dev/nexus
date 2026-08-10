function clean(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeName(value) {
  const v = clean(value);
  return v ? v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ') : null;
}

function normalizeDomain(value) {
  const v = clean(value);
  if (!v) return null;
  const host = v.includes('@') ? v.split('@')[1] : v;
  return host ? host.toLowerCase().replace(/^www\./, '') : null;
}

function normalizeVat(value) {
  const v = clean(value);
  return v ? v.toUpperCase().replace(/[^A-Z0-9]/g, '') : null;
}

module.exports = { clean, normalizeName, normalizeDomain, normalizeVat };
