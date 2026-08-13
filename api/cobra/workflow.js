'use strict';

const { requireScope } = require('../../modules/security/apiGuard');
const { SCOPES } = require('../../modules/security/scopes');

function cobraHeaders() {
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (process.env.COBRA_SERVICE_TOKEN) headers['X-Cobra-Token'] = process.env.COBRA_SERVICE_TOKEN;
  return headers;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const guard = requireScope(req, res, SCOPES.RESEARCH_EXECUTE);
  if (!guard.ok) return;

  const configured = process.env.COBRA_BASE_URL;
  if (!configured) return res.status(503).json({ error: 'COBRA connection not configured' });

  const input = typeof req.body === 'object' && req.body ? req.body : {};
  const requestId = String(input.request_id || '').trim();
  const instruction = String(input.instruction || '').trim();
  if (!requestId || !instruction) {
    return res.status(400).json({ error: 'request_id and instruction are required' });
  }

  const baseUrl = configured.replace(/\/$/, '');
  const controller = new AbortController();
  const timeoutMs = Math.max(5000, Math.min(Number(process.env.COBRA_WORKFLOW_TIMEOUT_MS) || 55000, 60000));
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Compatibility adapter: current COBRA exposes /api/chat as its proven orchestration entrypoint.
    // A dedicated async Nexus endpoint should replace this adapter before long-running production workflows.
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: cobraHeaders(),
      body: JSON.stringify({ message: instruction, voiceMode: false }),
      signal: controller.signal
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(502).json({
        request_id: requestId,
        status: 'failed',
        warnings: [`COBRA provider returned ${response.status}`],
        result: null
      });
    }

    return res.status(200).json({
      contract: 'workflow.execute.v1',
      request_id: requestId,
      status: 'completed',
      result: payload,
      warnings: ['Compatibility mode: synchronous /api/chat adapter'],
      usage: null
    });
  } catch (error) {
    if (error && error.name === 'AbortError') {
      return res.status(504).json({
        contract: 'workflow.execute.v1',
        request_id: requestId,
        status: 'partial',
        result: null,
        warnings: ['Nexus synchronous timeout reached; COBRA may still require an async service endpoint.']
      });
    }
    return res.status(502).json({
      contract: 'workflow.execute.v1',
      request_id: requestId,
      status: 'failed',
      result: null,
      warnings: ['COBRA unavailable']
    });
  } finally {
    clearTimeout(timeout);
  }
};
