const { readContact } = require('../contacts/service');
const { readContactInteractions } = require('../interactions/service');
const { findBusinessCardByLegacyContactId } = require('../businessCards/legacyNavigatorAdapter');
const { calculateLeadScore } = require('../leadScore/policy.v1');

async function readContactDetail(id) {
  const contactPayload = await readContact(id);
  if (!contactPayload) return null;

  const contact = contactPayload.contact;
  const sourceId = String(contact.crm_contact_id || '').replace(/^navigator:/, '');

  const [interactionsPayload, businessCard] = await Promise.all([
    readContactInteractions(sourceId, 200).catch(() => ({ items: [], degraded: true })),
    findBusinessCardByLegacyContactId(sourceId).catch(() => null)
  ]);

  const interactions = interactionsPayload.items || [];
  const score = calculateLeadScore({
    email: contact.person?.email,
    phone: contact.person?.phone,
    mobile: contact.person?.mobile,
    interaction_count: contact.interaction_count,
    interaction_types: interactions.map((x) => x.interaction_type),
    has_business_card: Boolean(businessCard),
    last_interaction_at: contact.last_interaction_at,
    lead_status: contact.lead_status,
    origin: contact.signals?.origin
  });

  return {
    contract: 'crm.contact.detail.v1',
    source_mode: 'navigator-read-adapter',
    contact,
    interactions,
    business_card: businessCard ? {
      source: 'navigator-business-cards',
      source_id: businessCard.id,
      photo_url: businessCard.photo_url || null,
      event_name: businessCard.event_name || null,
      met_at: businessCard.met_at || null,
      location: businessCard.location || null
    } : null,
    lead_score: score,
    degraded: Boolean(interactionsPayload.degraded)
  };
}

module.exports = { readContactDetail };
