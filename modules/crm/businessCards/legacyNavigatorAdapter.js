function getConfig() {
  const baseUrl = process.env.NAVIGATOR_SUPABASE_URL;
  const apiKey = process.env.NAVIGATOR_SUPABASE_KEY;
  if (!baseUrl || !apiKey) throw new Error('Navigator CRM read adapter is not configured');
  return { baseUrl: baseUrl.replace(/\/$/, ''), apiKey };
}

function headers(apiKey) {
  return { apikey: apiKey, Authorization: `Bearer ${apiKey}`, Accept: 'application/json' };
}

async function findBusinessCardByLegacyContactId(contactId) {
  const { baseUrl, apiKey } = getConfig();
  const params = new URLSearchParams();
  params.set('select', 'id,matched_contact_id,photo_url,event_name,met_at,location');
  params.set('matched_contact_id', `eq.${contactId}`);
  params.set('limit', '1');
  const response = await fetch(`${baseUrl}/rest/v1/business_cards?${params.toString()}`, { headers: headers(apiKey) });
  if (!response.ok) throw new Error(`Navigator business-card read failed (${response.status})`);
  const rows = await response.json();
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

module.exports = { findBusinessCardByLegacyContactId };
