function headers() {
  const h = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (process.env.COBRA_SERVICE_TOKEN) h['X-Cobra-Token'] = process.env.COBRA_SERVICE_TOKEN;
  return h;
}

function buildInstruction(request) {
  const lines = [
    `NEXUS_RESEARCH_REQUEST ${request.request_id}`,
    `Mode: ${request.mode}`,
    `Depth: ${request.depth}`,
    `Query: ${request.query}`
  ];
  if (request.sources.length) lines.push(`Preferred sources: ${request.sources.join(', ')}`);
  if (request.entity_refs.length) lines.push(`Entity refs: ${JSON.stringify(request.entity_refs)}`);
  if (Object.keys(request.constraints || {}).length) lines.push(`Constraints: ${JSON.stringify(request.constraints)}`);
  lines.push('Return findings, source references when available, confidence, gaps, and whether the result is partial. Do not mutate external systems.');
  return lines.join('\n');
}

async function executeWithCobra(request) {
  const configured = process.env.COBRA_BASE_URL;
  if (!configured) return { status: 'unavailable', partial: true, warnings: ['COBRA connection not configured'], result: null };

  const controller = new AbortController();
  const timeoutMs = Math.max(5000, Math.min(Number(process.env.COBRA_RESEARCH_TIMEOUT_MS) || 55000, 60000));
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${configured.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ message: buildInstruction(request), voiceMode: false }),
      signal: controller.signal
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return { status: 'failed', partial: true, warnings: [`COBRA returned ${response.status}`], result: null };
    return {
      status: 'completed',
      partial: false,
      warnings: ['Compatibility mode: COBRA /api/chat; dedicated research endpoint can replace this adapter later'],
      result: payload
    };
  } catch (error) {
    if (error && error.name === 'AbortError') return { status: 'partial', partial: true, warnings: ['COBRA research timeout'], result: null };
    return { status: 'failed', partial: true, warnings: ['COBRA unavailable'], result: null };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { executeWithCobra, buildInstruction };
