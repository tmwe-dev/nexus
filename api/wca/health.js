module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const baseUrl = process.env.WCA_BASE_URL;
  if (!baseUrl) {
    return res.status(503).json({ provider: 'wca', status: 'not_configured' });
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/partners?limit=1&page=1`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    return res.status(response.ok ? 200 : 502).json({
      provider: 'wca',
      status: response.ok ? 'ok' : 'degraded',
      latency_ms: Date.now() - startedAt,
      provider_status: response.status
    });
  } catch (error) {
    return res.status(502).json({
      provider: 'wca',
      status: 'unavailable',
      latency_ms: Date.now() - startedAt
    });
  } finally {
    clearTimeout(timeout);
  }
};
