module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const baseUrl = process.env.WCA_BASE_URL;
  if (!baseUrl) return res.status(503).json({ error: 'WCA connection not configured' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const headers = { Accept: 'application/json' };
    if (process.env.WCA_SERVICE_TOKEN) headers.Authorization = `Bearer ${process.env.WCA_SERVICE_TOKEN}`;

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/business-cards`, {
      method: 'GET',
      headers,
      signal: controller.signal
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(502).json({ error: 'WCA provider error', provider_status: response.status });
    }

    const cards = Array.isArray(payload.cards) ? payload.cards : [];
    const retrievedAt = new Date().toISOString();

    return res.status(200).json({
      contract: 'business-card.search.v1',
      source: 'wca',
      items: cards,
      total: cards.length,
      provenance: { source: 'wca', source_table: 'wca_business_cards', retrieved_at: retrievedAt }
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
