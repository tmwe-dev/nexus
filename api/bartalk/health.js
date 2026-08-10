module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const configured = process.env.BARTALK_BASE_URL;
  if (!configured) return res.status(503).json({ service: 'bartalk', status: 'not_configured' });

  const baseUrl = configured.replace(/\/$/, '');
  const controller = new AbortController();
  const timeoutMs = Math.max(1000, Math.min(Number(process.env.BARTALK_CONNECT_TIMEOUT_MS) || 5000, 15000));
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = { Accept: 'application/json' };
    if (process.env.BARTALK_SERVICE_TOKEN) headers.Authorization = `Bearer ${process.env.BARTALK_SERVICE_TOKEN}`;
    const response = await fetch(`${baseUrl}/api/health`, { headers, signal: controller.signal });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(502).json({ service: 'bartalk', status: 'provider_error', provider_status: response.status });
    return res.status(200).json({
      service: 'bartalk',
      status: 'available',
      contract: 'communication.health.v1',
      provider: payload,
      checked_at: new Date().toISOString()
    });
  } catch (error) {
    return res.status(error && error.name === 'AbortError' ? 504 : 502).json({
      service: 'bartalk',
      status: error && error.name === 'AbortError' ? 'timeout' : 'unavailable'
    });
  } finally {
    clearTimeout(timeout);
  }
};
