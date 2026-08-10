function daysSince(value) {
  if (!value) return null;
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return null;
  return Math.max(0, Math.floor((Date.now() - ts) / 86400000));
}

function deriveSignals(account = {}) {
  const signals = [];
  if ((account.contacts_count || 0) > 1) signals.push({ key: 'multi_contact', weight: 8 });
  if ((account.interaction_count || 0) >= 5) signals.push({ key: 'engaged_history', weight: 12 });
  if (account.identity_status === 'resolved') signals.push({ key: 'resolved_identity', weight: 8 });
  if ((account.identity_confidence || 0) >= 0.9) signals.push({ key: 'high_identity_confidence', weight: 5 });
  if (Array.isArray(account.source_refs) && account.source_refs.some((r) => r.source === 'wca')) signals.push({ key: 'wca_member', weight: 10 });

  const age = daysSince(account.last_interaction_at);
  if (age !== null && age <= 7) signals.push({ key: 'recent_activity_7d', weight: 15 });
  else if (age !== null && age <= 30) signals.push({ key: 'recent_activity_30d', weight: 8 });
  else if (age !== null && age >= 90) signals.push({ key: 'stale_90d', weight: -12 });

  if (account.lead_status === 'engaged') signals.push({ key: 'engaged_stage', weight: 10 });
  if (account.lead_status === 'qualified') signals.push({ key: 'qualified_stage', weight: 20 });
  if (account.lead_status === 'negotiation') signals.push({ key: 'negotiation_stage', weight: 25 });
  if (account.lead_status === 'converted') signals.push({ key: 'converted_stage', weight: -20 });
  if (account.lead_status === 'archived' || account.lead_status === 'blacklisted') signals.push({ key: 'inactive_terminal', weight: -100 });

  return signals;
}

module.exports = { deriveSignals, daysSince };
