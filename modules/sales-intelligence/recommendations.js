function recommendNextAction(account = {}, ranking = {}) {
  const stage = account.lead_status || 'new';
  if (stage === 'blacklisted' || stage === 'archived') return { action: 'none', reason: 'terminal_stage' };
  if (stage === 'converted') return { action: 'account_growth', reason: 'converted_customer' };
  if (stage === 'negotiation') return { action: 'follow_proposal', reason: 'negotiation_active' };
  if (stage === 'qualified') return { action: 'prepare_proposal', reason: 'explicit_need_identified' };
  if (stage === 'engaged') return { action: 'qualify_need', reason: 'engagement_detected' };
  if (stage === 'holding') return { action: 'review_follow_up', reason: 'waiting_for_reply' };
  if (stage === 'first_touch_sent') return { action: 'await_or_follow_up', reason: 'first_contact_sent' };
  if ((ranking.score || 0) >= 65) return { action: 'prioritize_first_touch', reason: 'high_priority_new_lead' };
  return { action: 'research_or_nurture', reason: 'insufficient_signal' };
}

module.exports = { recommendNextAction };
