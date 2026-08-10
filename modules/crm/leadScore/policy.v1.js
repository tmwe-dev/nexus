const POLICY_VERSION = 'navigator-compatible.v1';

function calculateLeadScore(input = {}) {
  let score = 0;
  const breakdown = {};
  const add = (label, points) => { score += points; breakdown[label] = points; };

  if (input.email) add('Email', 15);
  if (input.phone || input.mobile) add('Telefono', 10);
  if ((Number(input.interaction_count) || 0) > 5) add('Interazioni 5+', 15);

  const interactionTypes = Array.isArray(input.interaction_types) ? input.interaction_types : [];
  if (interactionTypes.includes('email_sent') && interactionTypes.some((t) => t === 'email_received' || t === 'email_reply')) add('Risposta email', 25);
  if (interactionTypes.includes('meeting')) add('Meeting', 20);
  if (input.has_business_card) add('Biglietto visita', 10);

  if (input.last_interaction_at) {
    const days = (Date.now() - new Date(input.last_interaction_at).getTime()) / 86400000;
    if (Number.isFinite(days)) {
      if (days < 7) add('Recente <7gg', 15);
      else if (days < 30) add('Recente <30gg', 10);
      else if (days < 90) add('Recente <90gg', 5);
    }
  }

  if (input.lead_status === 'negotiation' || input.lead_status === 'converted') add('Status avanzato', 20);
  if (typeof input.origin === 'string' && input.origin.toLowerCase().includes('incontro')) add('Incontro personale', 15);

  return {
    contract: 'sales.lead-score.v1',
    policy_version: POLICY_VERSION,
    score: Math.min(score, 100),
    max_score: 100,
    breakdown,
    calculated_at: new Date().toISOString()
  };
}

module.exports = { POLICY_VERSION, calculateLeadScore };
