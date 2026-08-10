function getConfig() {
  const baseUrl = process.env.NAVIGATOR_SUPABASE_URL;
  const apiKey = process.env.NAVIGATOR_SUPABASE_KEY;
  if (!baseUrl || !apiKey) throw new Error('Navigator CRM read adapter is not configured');
  return { baseUrl: baseUrl.replace(/\/$/, ''), apiKey };
}

function headers(apiKey) {
  return { apikey: apiKey, Authorization: `Bearer ${apiKey}`, Accept: 'application/json' };
}

async function listInteractionsByLegacyContactId(contactId, limit = 100) {
  const { baseUrl, apiKey } = getConfig();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
  const params = new URLSearchParams();
  params.set('select', 'id,contact_id,interaction_type,title,description,outcome,created_at,created_by');
  params.set('contact_id', `eq.${contactId}`);
  params.set('order', 'created_at.desc');
  params.set('limit', String(safeLimit));
  const response = await fetch(`${baseUrl}/rest/v1/contact_interactions?${params.toString()}`, { headers: headers(apiKey) });
  if (!response.ok) throw new Error(`Navigator CRM interactions read failed (${response.status})`);
  const rows = await response.json();
  return Array.isArray(rows) ? rows : [];
}

module.exports = { listInteractionsByLegacyContactId };
