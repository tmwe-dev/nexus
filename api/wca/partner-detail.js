function providerHeaders() {
  const headers = { Accept: 'application/json' };
  if (process.env.WCA_SERVICE_TOKEN) headers.Authorization = `Bearer ${process.env.WCA_SERVICE_TOKEN}`;
  return headers;
}

async function fetchPage(baseUrl, page, limit, signal) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    select: 'wca_id,company_name,country_code,country_name,city,address,mailing,phone,fax,emergency_call,email,website,logo_url,profile_text,branch,member_since,expires,networks,services,certifications,branch_cities,contacts'
  });
  const response = await fetch(`${baseUrl}/api/partners?${params}`, {
    headers: providerHeaders(),
    signal
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`provider:${response.status}`);
  return Array.isArray(payload.partners) ? payload.partners : [];
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const rawId = req.query.wca_id || req.query.id;
  const wcaId = Number(rawId);
  if (!Number.isFinite(wcaId) || wcaId <= 0) return res.status(400).json({ error: 'Valid wca_id required' });

  const configured = process.env.WCA_BASE_URL;
  if (!configured) return res.status(503).json({ error: 'WCA connection not configured' });
  const baseUrl = configured.replace(/\/$/, '');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const pageSize = 1000;
  const maxPages = Math.max(1, Math.min(Number(process.env.WCA_DETAIL_MAX_PAGES) || 20, 50));

  try {
    let partner = null;
    for (let page = 1; page <= maxPages; page += 1) {
      const rows = await fetchPage(baseUrl, page, pageSize, controller.signal);
      partner = rows.find(row => Number(row.wca_id) === wcaId) || null;
      if (partner || rows.length < pageSize) break;
    }

    if (!partner) return res.status(404).json({ error: 'WCA partner not found', wca_id: wcaId });

    return res.status(200).json({
      contract: 'partner.read.v1',
      source: 'wca',
      item: {
        ...partner,
        emergency_phone: partner.emergency_call ?? null,
        membership_expires: partner.expires ?? null
      },
      provenance: {
        source: 'wca',
        source_table: 'wca_profiles',
        source_record_id: String(wcaId),
        retrieved_at: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error && error.name === 'AbortError') return res.status(504).json({ error: 'WCA provider timeout' });
    const status = String(error && error.message || '').startsWith('provider:') ? 502 : 500;
    return res.status(status).json({ error: status === 502 ? 'WCA provider error' : 'Partner detail failed' });
  } finally {
    clearTimeout(timeout);
  }
};