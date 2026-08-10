const { readContactInteractions } = require('../interactions/service');

function mapInteractionToActivity(item) {
  return {
    contract: 'crm.activity.v1',
    activity_id: `navigator-interaction:${item.interaction_id}`,
    crm_contact_id: item.crm_contact_id,
    activity_type: item.interaction_type || 'other',
    title: item.title || '',
    description: item.description || null,
    outcome: item.outcome || null,
    occurred_at: item.created_at || null,
    actor_id: item.created_by || null,
    source_refs: [{ source: 'navigator', record_type: 'contact_interaction', source_id: item.interaction_id }],
    read_only: true
  };
}

async function readContactActivities(contactId, limit) {
  const payload = await readContactInteractions(contactId, limit);
  return {
    contract: 'crm.activity.search.v1',
    source_mode: payload.source_mode || 'navigator-read-adapter',
    items: (payload.items || []).map(mapInteractionToActivity),
    degraded: Boolean(payload.degraded)
  };
}

module.exports = { mapInteractionToActivity, readContactActivities };
