const { listInteractionsByLegacyContactId } = require('./legacyNavigatorAdapter');

function mapInteraction(row) {
  return {
    interaction_id: row.id,
    crm_contact_id: `navigator:${row.contact_id}`,
    interaction_type: row.interaction_type || 'unknown',
    title: row.title || '',
    description: row.description || null,
    outcome: row.outcome || null,
    created_at: row.created_at || null,
    created_by: row.created_by || null,
    source_ref: { source: 'navigator', source_id: row.id, record_type: 'contact_interaction' }
  };
}

async function readContactInteractions(crmContactId, limit) {
  const sourceId = String(crmContactId || '').replace(/^navigator:/, '');
  if (!sourceId) throw new Error('Contact id required');
  const rows = await listInteractionsByLegacyContactId(sourceId, limit);
  return {
    contract: 'crm.activity.search.v1',
    source_mode: 'navigator-read-adapter',
    items: rows.map(mapInteraction)
  };
}

module.exports = { readContactInteractions };
