function providerHeaders() {
  const headers = { Accept: 'application/json' };
  if (process.env.WCA_SERVICE_TOKEN) headers.Authorization = `Bearer ${process.env.WCA_SERVICE_TOKEN}`;
  return headers;
}

function normalizeContact(contact, partner) {
  return {
    source: 'wca',
    source_partner_id: Number(partner.wca_id),
    company_name: partner.company_name || null,
    country_code: partner.country_code || null,
    name: contact?.name || null,
    title: contact?.title || null,
    email: contact?.email || null,
    phone: contact?.direct_phone || contact?.direct_line || contact?.phone || null,
    mobile: contact?.mobile || null,
    is_primary: typeof contact?.is_primary === 'boolean' ? contact.is_primary : null,
    contact_alias: contact?.contact_alias || null
  };
}

async function fetchPartnerPage(baseUrl, params, signal) {
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
  const configured = process.env.WCA_BASE_URL;
  if (!configured) return res.status(503).json({ error: 'WCA connection not configured' });

  const baseUrl = configured.replace(/\/$/, '');
  const requestedWcaId = req.query.wca_id ? Number(req.query.wca_id) : null;
  if (req.query.wca_id && (!Number.isFinite(requestedWcaId) || requestedWcaId <= 0)) {
    return res.status(400).json({ error: 'Valid wca_id required' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    let partners = [];

    if (requestedWcaId) {
      const pageSize = 1000;
      const maxPages = Math.max(1, Math.min(Number(process.env.WCA_DETAIL_MAX_PAGES) || 20, 50));
      for (let page = 1; page <= maxPages; page += 1) {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
          select: 'wca_id,company_name,country_code,contacts'
        });
        const rows = await fetchPartnerPage(baseUrl, params, controller.signal);
        const match = rows.find(p => Number(p.wca_id) === requestedWcaId);
        if (match) { partners = [match]; break; }
        if (rows.length < pageSize) break;
      }
    } else {
      const params = new URLSearchParams();
      if (req.query.search) params.set('search', String(req.query.search));
      if (req.query.country) params.set('country', String(req.query.country));
      params.set('page', String(Number(req.query.page) || 1));
      params.set('limit', String(Math.min(Number(req.query.limit) || 100, 250)));
      params.set('select', 'wca_id,company_name,country_code,contacts');
      partners = await fetchPartnerPage(baseUrl, params, controller.signal);
    }

    const items = partners.flatMap(partner => Array.isArray(partner.contacts)
      ? partner.contacts.map(contact => normalizeContact(contact, partner))
      : []);

    return res.status(200).json({
      contract: 'contact.search.v1',
      source: 'wca',
      items,
      total: items.length,
      provenance: { source: 'wca', source_table: 'wca_profiles.contacts', retrieved_at: new Date().toISOString() }
    });
  } catch (error) {
    if (error && error.name === 'AbortError') return res.status(504).json({ error: 'WCA provider timeout' });
    return res.status(502).json({ error: 'WCA provider unavailable' });
  } finally {
    clearTimeout(timeout);
  }
};