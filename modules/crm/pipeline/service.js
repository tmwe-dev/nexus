const { searchContacts } = require('../contacts/service');
const { instrumentCapability } = require('../../observability/instrumentCapability');

const ACTIVE_STAGES = [
  'new',
  'first_touch_sent',
  'holding',
  'engaged',
  'qualified',
  'negotiation',
  'converted'
];

const PASSIVE_STATES = ['archived', 'blacklisted'];

async function readPipeline(filters = {}) {
  return instrumentCapability('crm.pipeline.search.v1', 'crm', async () => {
    const result = await searchContacts({ ...filters, limit: filters.limit || 200 });
    const stages = Object.fromEntries([...ACTIVE_STAGES, ...PASSIVE_STATES].map(stage => [stage, []]));
    for (const contact of result.items) {
      const stage = stages[contact.lead_status] ? contact.lead_status : 'new';
      stages[stage].push(contact);
    }
    return {
      contract: 'crm.pipeline.search.v1',
      source_mode: result.source_mode,
      stages: ACTIVE_STAGES.map(id => ({ id, items: stages[id], count: stages[id].length })),
      excluded_states: PASSIVE_STATES.map(id => ({ id, count: stages[id].length })),
      total_loaded: result.items.length,
      page: result.page
    };
  }, { external_calls: 1, operation: 'readPipeline' });
}

module.exports = { readPipeline, ACTIVE_STAGES, PASSIVE_STATES };
