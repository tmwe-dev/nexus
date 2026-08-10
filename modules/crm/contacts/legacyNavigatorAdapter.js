const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function getConfig() {
  const baseUrl = process.env.NAVIGATOR_SUPABASE_URL;
  const apiKey = process.env.NAVIGATOR_SUPABASE_KEY;
  if (!baseUrl || !apiKey) throw new Error('Navigator CRM read adapter is not configured');
  return { baseUrl: baseUrl.replace(/\/$/, ''), apiKey };
}

function headers(apiKey) {
  return {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json'
  };
}

function clampLimit(value) {
  const n = Number(value) || DEFAULT_LIMIT;
  return Math.max(1, Math.min(n, MAX_LIMIT));
}

function sanitizeTerm(value) {
  return String(value || '').trim().replace(/[(),]/g, ' ').slice(0, 120);
}

async function listLegacyContacts(filters = {}) {
  const { baseUrl, apiKey } = getConfig();
  const limit = clampLimit(filters.limit);
  const offset = Math.max(0, Number(filters.offset) || 0);
  const params = new URLSearchParams();
  params.set('select', [
    'id','company_name','company_alias','name','contact_alias','position','email','phone','mobile',
    'address','city','zip_code','country','origin','lead_status','status_reason','operator_id','note',
    'interaction_count','last_interaction_at','converted_at','lead_score','deep_search_at',
    'wca_partner_id','wca_match_confidence'
  ].join(','));
  params.set('order', 'created_at.desc');
  params.set('limit', String(limit));
  params.set('offset', String(offset));

  if (filters.country) params.set('country', `eq.${sanitizeTerm(filters.country)}`);
  if (filters.origin) params.set('origin', `eq.${sanitizeTerm(filters.origin)}`);
  if (filters.lead_status) params.set('lead_status', `eq.${sanitizeTerm(filters.lead_status)}`);
  if (filters.wca_match === 'matched') params.set('wca_partner_id', 'not.is.null');
  if (filters.wca_match === 'unmatched') params.set('wca_partner_id', 'is.null');
  if (filters.search) {
    const q = sanitizeTerm(filters.search);
    if (q) params.set('or', `(name.ilike.*${q}*,company_name.ilike.*${q}*,email.ilike.*${q}*,city.ilike.*${q}*)`);
  }

  const response = await fetch(`${baseUrl}/rest/v1/imported_contacts?${params.toString()}`, {
    headers: { ...headers(apiKey), Prefer: 'count=exact' }
  });
  if (!response.ok) throw new Error(`Navigator CRM read failed (${response.status})`);
  const rows = await response.json();
  const range = response.headers.get('content-range');
  const total = range && range.includes('/') ? Number(range.split('/')[1]) : null;
  return { rows: Array.isArray(rows) ? rows : [], total, limit, offset };
}

async function getLegacyContactById(id) {
  if (!id || typeof id !== 'string') return null;
  const { baseUrl, apiKey } = getConfig();
  const params = new URLSearchParams();
  params.set('select', '*');
  params.set('id', `eq.${id}`);
  params.set('limit', '1');
  const response = await fetch(`${baseUrl}/rest/v1/imported_contacts?${params.toString()}`, { headers: headers(apiKey) });
  if (!response.ok) throw new Error(`Navigator CRM detail read failed (${response.status})`);
  const rows = await response.json();
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

module.exports = { listLegacyContacts, getLegacyContactById };
