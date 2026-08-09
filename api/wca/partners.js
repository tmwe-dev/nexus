function buildQuery(query = {}) {
  const params = new URLSearchParams();
  if (query.search) params.set('search', String(query.search));
  if (query.country) params.set('country', String(query.country));
  params.set('page', String(query.page || 1));
  params.set('limit', String(Math.min(Number(query.limit) || 100, 500)));
  return params.toString();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const baseUrl = process.env.WCA_BASE_URL;
  if (!baseUrl) return res.status(503).json({ error: 'WCA connection not configured' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const headers = { Accept: 'application/json' };
    if (process.env.WCA_SERVICE_TOKEN) headers.Authorization = `Bearer ${process.env.WCA_SERVICE_TOKEN}`;

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/partners?${buildQuery(req.query)}`, {
      method: 'GET',
      headers,
      signal: controller.signal
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(502).json({ error: 'WCA provider error', provider_status: response.status });
    }

    const partners = Array.isArray(payload.partners) ? payload.partners : [];
    const retrievedAt = new Date().toISOString();

    return res.status(200).json({
      contract: 'partner.search.v1',
      source: 'wca',
      items: partners,
      total: Number(payload.total ?? partners.length),
      page: Number(payload.page ?? req.query.page ?? 1),
      provenance: { source: 'wca', source_table: 'wca_profiles', retrieved_at: retrievedAt }
    });
  } catch (error) {
    const timeoutError = error && error.name === 'AbortError';
    return res.status(timeoutError ? 504 : 502).json({
      error: timeoutError ? 'WCA provider timeout' : 'WCA provider unavailable'
    });
  } finally {
    clearTimeout(timeout);
  }
};
