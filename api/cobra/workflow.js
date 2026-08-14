'use strict';

const { requireScope } = require('../../modules/security/apiGuard');
const { SCOPES } = require('../../modules/security/scopes');
const idempotency = require('../../modules/idempotency/ledger');

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
  if (!requestId || !instruction) return res.status(400).json({ error: 'request_id and instruction are required' });

  const baseUrl = configured.replace(/\/$/, '');
  try {
    const execution = await idempotency.run({ req, capability:'workflow.execute.v1', auth:guard.auth, responseStatus:200, keyOverride:requestId }, async () => {
      const controller = new AbortController();
      const timeoutMs = Math.max(5000, Math.min(Number(process.env.COBRA_WORKFLOW_TIMEOUT_MS) || 55000, 60000));
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(`${baseUrl}/api/chat`, {
          method:'POST',
          headers:cobraHeaders(),
          body:JSON.stringify({ message:instruction, voiceMode:false }),
          signal:controller.signal
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          const error = new Error(`COBRA provider returned ${response.status}`);
          error.status = 502;
          error.code = 'COBRA_PROVIDER_FAILED';
          throw error;
        }
        return { request_id:requestId, payload };
      } finally {
        clearTimeout(timeout);
      }
    });

    if (execution.replayed) {
      return res.status(execution.ticket.response_status || 200).json({
        contract:'workflow.execute.v1', request_id:requestId, status:'completed', result:null,
        warnings:['Idempotent replay: COBRA was not executed again.'],
        idempotency:{replayed:true,key:execution.ticket.key,durable:true,result_ref:execution.ticket.result_ref||requestId}, usage:null
      });
    }

    return res.status(200).json({
      contract:'workflow.execute.v1', request_id:requestId, status:'completed', result:execution.result.payload,
      warnings:['Compatibility mode: synchronous /api/chat adapter'],
      idempotency:{replayed:false,key:execution.ticket.key||requestId,durable:Boolean(execution.ticket.durable)}, usage:null
    });
  } catch (error) {
    if (error?.name === 'AbortError') return res.status(504).json({contract:'workflow.execute.v1',request_id:requestId,status:'partial',result:null,warnings:['Nexus synchronous timeout reached; operation outcome is treated as unknown and protected by idempotency.']});
    return res.status(error.status||502).json({contract:'workflow.execute.v1',request_id:requestId,status:'failed',result:null,error:error.code||'COBRA_UNAVAILABLE',warnings:[error.message||'COBRA unavailable'],detail:error.details||null});
  }
};
