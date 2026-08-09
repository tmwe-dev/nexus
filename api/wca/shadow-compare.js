function wcaHeaders() {
  const headers = { Accept: 'application/json' };
  if (process.env.WCA_SERVICE_TOKEN) headers.Authorization = `Bearer ${process.env.WCA_SERVICE_TOKEN}`;
  return headers;
}

function navigatorHeaders() {
  const key = process.env.NAVIGATOR_SUPABASE_KEY;
  return key ? { apikey: key, Authorization: `Bearer ${key}` } : {};
}

function comparableWca(row) {
  return {
    wca_id: Number(row.wca_id),
    company_name: row.company_name || null,
    country_code: row.country_code || null,
    country_name: row.country_name || null,
    city: row.city || null,
    address: row.address || null,
    phone: row.phone || null,
    fax: row.fax || null,
    emergency_phone: row.emergency_call || null,
    email: row.email || null,
    website: row.website || null,
    member_since: row.member_since || null,
    membership_expires: row.expires || null,
    profile_description: row.profile_text || null,
    logo_url: row.logo_url || null
  };
}

function comparableNavigator(row) {
  return {
    wca_id: Number(row.wca_id),
    company_name: row.company_name || null,
    country_code: row.country_code || null,
    country_name: row.country_name || null,
    city: row.city || null,
    address: row.address || null,
    phone: row.phone || null,
    fax: row.fax || null,
    emergency_phone: row.emergency_phone || null,
    email: row.email || null,
    website: row.website || null,
    member_since: row.member_since || null,
    membership_expires: row.membership_expires || null,
    profile_description: row.profile_description || null,
    logo_url: row.logo_url || null
  };
}

function differences(a, b) {
  const out = {};
  for (const key of Object.keys(a)) {
    const av = a[key] == null ? null : String(a[key]).trim();
    const bv = b[key] == null ? null : String(b[key]).trim();
    if (av !== bv) out[key] = { wca: a[key], navigator: b[key] };
  }
  return out;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const wcaBase = process.env.WCA_BASE_URL;
  const navBase = process.env.NAVIGATOR_SUPABASE_URL;
  const navKey = process.env.NAVIGATOR_SUPABASE_KEY;
  if (!wcaBase || !navBase || !navKey) {
    return res.status(503).json({
      status: 'not_configured',
      required: ['WCA_BASE_URL', 'NAVIGATOR_SUPABASE_URL', 'NAVIGATOR_SUPABASE_KEY']
    });
  }

  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const params = new URLSearchParams({ page: '1', limit: String(limit), select: 'wca_id,company_name,country_code,country_name,city,address,phone,fax,emergency_call,email,website,member_since,expires,profile_text,logo_url' });
  if (req.query.country) params.set('country', String(req.query.country));
  if (req.query.search) params.set('search', String(req.query.search));

  try {
    const wcaResponse = await fetch(`${wcaBase.replace(/\/$/, '')}/api/partners?${params}`, { headers: wcaHeaders() });
    if (!wcaResponse.ok) return res.status(502).json({ error: 'WCA provider error', provider_status: wcaResponse.status });
    const wcaPayload = await wcaResponse.json();
    const wcaRows = Array.isArray(wcaPayload.partners) ? wcaPayload.partners : [];
    const ids = wcaRows.map(r => Number(r.wca_id)).filter(Number.isFinite);

    if (ids.length === 0) return res.status(200).json({ status: 'ok', compared: 0, matches: 0, mismatches: 0, missing_in_navigator: 0, items: [] });

    const navSelect = 'wca_id,company_name,country_code,country_name,city,address,phone,fax,emergency_phone,email,website,member_since,membership_expires,profile_description,logo_url';
    const navUrl = `${navBase.replace(/\/$/, '')}/rest/v1/partners?select=${encodeURIComponent(navSelect)}&wca_id=in.(${ids.join(',')})`;
    const navResponse = await fetch(navUrl, { headers: navigatorHeaders() });
    if (!navResponse.ok) return res.status(502).json({ error: 'Navigator read-model error', navigator_status: navResponse.status });
    const navRows = await navResponse.json();
    const navById = new Map((Array.isArray(navRows) ? navRows : []).map(r => [Number(r.wca_id), r]));

    const items = wcaRows.map(raw => {
      const wca = comparableWca(raw);
      const navRaw = navById.get(wca.wca_id);
      if (!navRaw) return { wca_id: wca.wca_id, status: 'missing_in_navigator' };
      const nav = comparableNavigator(navRaw);
      const diff = differences(wca, nav);
      return { wca_id: wca.wca_id, status: Object.keys(diff).length ? 'mismatch' : 'match', differences: diff };
    });

    const summary = items.reduce((acc, item) => {
      acc.compared += 1;
      if (item.status === 'match') acc.matches += 1;
      else if (item.status === 'mismatch') acc.mismatches += 1;
      else if (item.status === 'missing_in_navigator') acc.missing_in_navigator += 1;
      return acc;
    }, { compared: 0, matches: 0, mismatches: 0, missing_in_navigator: 0 });

    return res.status(200).json({ status: 'ok', ...summary, items, compared_at: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ error: 'Shadow comparison failed' });
  }
};