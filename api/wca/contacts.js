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

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const configured = process.env.WCA_BASE_URL;
  if (!configured) return res.status(503).json({ error: 'WCA connection not configured' });

  const baseUrl = configured.replace(/\/$/, '');
  const params = new URLSearchParams();
  if (req.query.search) params.set('search', String(req.query.search));
  if (req.query.country) params.set('country', String(req.query.country));
  params.set('page', String(Number(req.query.page) || 1));
  params.set('limit', String(Math.min(Number(req.query.limit) || 100, 250)));
  params.set('select', 'wca_id,company_name,country_code,contacts');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${baseUrl}/api/partners?${params}`, {
      headers: providerHeaders(),
      signal: controller.signal
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(502).json({ error: 'WCA provider error', provider_status: response.status });

    const partners = Array.isArray(payload.partners) ? payload.partners : [];
    const requestedWcaId = req.query.wca_id ? Number(req.query.wca_id) : null;
    const filtered = requestedWcaId ? partners.filter(p => Number(p.wca_id) === requestedWcaId) : partners;
    const items = filtered.flatMap(partner => Array.isArray(partner.contacts)
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
    return res.status(error && error.name === 'AbortError' ? 504 : 502).json({
      error: error && error.name === 'AbortError' ? 'WCA provider timeout' : 'WCA provider unavailable'
    });
  } finally {
    clearTimeout(timeout);
  }
};