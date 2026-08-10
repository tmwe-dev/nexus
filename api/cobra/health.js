function cobraHeaders() {
  const headers = { Accept: 'application/json' };
  if (process.env.COBRA_SERVICE_TOKEN) headers['X-Cobra-Token'] = process.env.COBRA_SERVICE_TOKEN;
  return headers;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const configured = process.env.COBRA_BASE_URL;
  if (!configured) {
    return res.status(503).json({ service: 'cobra', status: 'not_configured' });
  }

  const baseUrl = configured.replace(/\/$/, '');
  const controller = new AbortController();
  const timeoutMs = Math.max(1000, Math.min(Number(process.env.COBRA_CONNECT_TIMEOUT_MS) || 5000, 15000));
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/api/status`, {
      method: 'GET',
      headers: cobraHeaders(),
      signal: controller.signal
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(502).json({
        service: 'cobra',
        status: 'provider_error',
        provider_status: response.status
      });
    }

    return res.status(200).json({
      service: 'cobra',
      status: 'available',
      contract: 'service.health.v1',
      capabilities: ['workflow.execute.v1', 'web.research.v1', 'browser.execute.v1'],
      provider: payload,
      checked_at: new Date().toISOString()
    });
  } catch (error) {
    return res.status(error && error.name === 'AbortError' ? 504 : 502).json({
      service: 'cobra',
      status: error && error.name === 'AbortError' ? 'timeout' : 'unavailable'
    });
  } finally {
    clearTimeout(timeout);
  }
};
