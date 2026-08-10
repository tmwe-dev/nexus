const RULES = {
  new: { channels: ['email'], min_days: 0, max_per_week: 1 },
  first_touch_sent: { channels: ['email','linkedin'], min_days: 3, max_per_week: 2 },
  holding: { channels: ['email','linkedin'], min_days: 14, max_per_week: 1 },
  engaged: { channels: ['email','linkedin','whatsapp'], min_days: 2, max_per_week: 3 },
  qualified: { channels: ['email','linkedin','whatsapp'], min_days: 2, max_per_week: 4 },
  negotiation: { channels: ['email','whatsapp'], min_days: 1, max_per_week: 7 },
  converted: { channels: ['email','linkedin','whatsapp'], min_days: 7, max_per_week: 1 },
  archived: { channels: [], min_days: 90, max_per_week: 0 },
  blacklisted: { channels: [], min_days: 99999, max_per_week: 0 }
};

const FIRST_ENGAGEMENT = [
  { day: 0, channel: 'email', action: 'cold_outreach' },
  { day: 3, channel: 'email', action: 'follow_up_1', condition: 'no_reply' },
  { day: 5, channel: 'linkedin', action: 'connection_request', condition: 'no_reply' },
  { day: 7, channel: 'email', action: 'follow_up_2_value_add', condition: 'no_reply' },
  { day: 10, channel: 'linkedin', action: 'linkedin_message', condition: 'no_reply+linkedin_connected' },
  { day: 14, channel: 'email', action: 'breakup_email', condition: 'no_reply' }
];

function checkCadence({ stage='new', channel='email', last_contact_at=null, touches_this_week=0, whatsapp_consent=false } = {}) {
  const rule = RULES[stage] || RULES.new;
  if (!rule.channels.includes(channel)) return { allowed:false, reason:'channel_blocked', suggested_channel:rule.channels[0] || null };
  if (channel === 'whatsapp' && !whatsapp_consent && stage !== 'negotiation') return { allowed:false, reason:'whatsapp_consent_required', suggested_channel:'email' };
  if (touches_this_week >= rule.max_per_week) return { allowed:false, reason:'weekly_limit' };
  if (last_contact_at) {
    const last = new Date(last_contact_at).getTime();
    if (Number.isFinite(last)) {
      const days = Math.floor((Date.now() - last) / 86400000);
      if (days < rule.min_days) return { allowed:false, reason:'too_soon', next_allowed_at:new Date(last + rule.min_days*86400000).toISOString() };
    }
  }
  return { allowed:true, reason:'ok' };
}

module.exports = { RULES, FIRST_ENGAGEMENT, checkCadence };
