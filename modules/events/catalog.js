const { registerEventSchema } = require('./registry');

const INITIAL_SCHEMAS = [
  {
    event: 'crm.contact.updated',
    version: 1,
    owner: 'crm',
    description: 'A CRM contact projection changed.',
    compatibility: 'backward',
    payload: { required: ['crm_contact_id'], optional: ['identity_contact_id', 'identity_company_id', 'changed_fields'] }
  },
  {
    event: 'crm.account.stage.changed',
    version: 1,
    owner: 'crm',
    description: 'The commercial stage of a CRM account changed.',
    compatibility: 'backward',
    payload: { required: ['crm_account_id', 'from_stage', 'to_stage'], optional: ['identity_company_id', 'reason'] }
  },
  {
    event: 'marketing.campaign.planned',
    version: 1,
    owner: 'marketing-automation',
    description: 'A dry-run campaign plan was produced.',
    compatibility: 'backward',
    payload: { required: ['campaign_id', 'channel', 'audience_count'], optional: ['eligible_count', 'blocked_count'] }
  },
  {
    event: 'research.completed',
    version: 1,
    owner: 'research-engine',
    description: 'A research request completed or returned a partial result.',
    compatibility: 'backward',
    payload: { required: ['request_id', 'status'], optional: ['partial', 'entity_refs', 'warnings'] }
  },
  {
    event: 'email.received',
    version: 1,
    owner: 'funnemail',
    description: 'An email was received by the email service.',
    compatibility: 'backward',
    payload: { required: ['message_id'], optional: ['thread_id', 'sender_ref', 'recipient_refs'] }
  }
];

function ensureInitialEventSchemas() {
  const registered = [];
  for (const schema of INITIAL_SCHEMAS) {
    try { registered.push(registerEventSchema(schema)); }
    catch (error) {
      if (!String(error?.message || '').startsWith('EVENT_SCHEMA_ALREADY_REGISTERED:')) throw error;
    }
  }
  return registered;
}

module.exports = { INITIAL_SCHEMAS, ensureInitialEventSchemas };
