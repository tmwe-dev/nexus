const { buildAudience } = require('../audience/service');
const { checkCadence } = require('../cadence/policy.v1');

async function planCampaign(input = {}) {
  const audience = await buildAudience(input.filters || {});
  const channel = input.channel || 'email';
  const actions = (audience.items || []).map(item => {
    const cadence = checkCadence({
      stage: item.lead_status,
      channel,
      last_contact_at: item.last_interaction_at || null,
      touches_this_week: Number(item.touches_this_week) || 0,
      whatsapp_consent: Boolean(item.whatsapp_consent)
    });
    return {
      crm_account_id: item.crm_account_id,
      identity_company_id: item.identity_company_id || null,
      channel,
      cadence,
      status: cadence.allowed ? 'eligible' : 'blocked',
      execution_owner: channel === 'email' ? 'funnemail' : 'external-channel-service',
      orchestrator: 'cobra',
      recommendation: item.recommendation || null
    };
  });

  return {
    contract: 'marketing.campaign.plan.v1',
    campaign_id: input.campaign_id || null,
    name: input.name || null,
    channel,
    audience_count: audience.items.length,
    eligible_count: actions.filter(a => a.status === 'eligible').length,
    blocked_count: actions.filter(a => a.status === 'blocked').length,
    actions,
    dry_run: true,
    rule: 'Nexus plans campaigns only. Sending remains owned by communication services and orchestration by COBRA.'
  };
}

module.exports = { planCampaign };
