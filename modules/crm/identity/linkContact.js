const { resolveCompany } = require('../../identity/company/resolver');
const { resolveContact } = require('../../identity/contact/resolver');

function buildCompanyCandidates(contact) {
  const candidates = [];
  const navigatorRef = contact.source_refs?.find((ref) => ref.source === 'navigator' && ref.record_type === 'contact');
  if (navigatorRef) {
    candidates.push({
      source: 'navigator',
      source_id: navigatorRef.source_id,
      company_name: contact.company?.source_name || contact.company?.display_name,
      email: contact.person?.email,
      country: contact.company?.country
    });
  }
  const wcaRef = contact.source_refs?.find((ref) => ref.source === 'wca' && ref.record_type === 'company');
  if (wcaRef) {
    candidates.push({
      source: 'wca',
      source_id: wcaRef.source_id,
      wca_partner_id: wcaRef.source_id,
      company_name: contact.company?.source_name || contact.company?.display_name,
      country: contact.company?.country
    });
  }
  return candidates;
}

function linkContactIdentity(contact) {
  if (!contact) return null;
  const companyResolution = resolveCompany(buildCompanyCandidates(contact));
  const navigatorRef = contact.source_refs?.find((ref) => ref.source === 'navigator' && ref.record_type === 'contact');
  const contactCandidates = navigatorRef ? [{
    source: 'navigator',
    source_id: navigatorRef.source_id,
    email: contact.person?.email,
    phone: contact.person?.phone || contact.person?.mobile,
    name: contact.person?.source_name || contact.person?.display_name,
    company_identity_id: companyResolution?.identity_company_id || null
  }] : [];
  const contactResolution = resolveContact(contactCandidates);

  return {
    ...contact,
    identity_contact_id: contactResolution?.identity_contact_id || contact.identity_contact_id,
    identity_company_id: companyResolution?.identity_company_id || contact.identity_company_id,
    identity: { contact: contactResolution, company: companyResolution }
  };
}

module.exports = { linkContactIdentity, buildCompanyCandidates };
