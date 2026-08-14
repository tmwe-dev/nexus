'use strict';

const CAPABILITIES = Object.freeze([
  { name:'partner.search.v1', owner:'wca', route:'/api/wca/partners', method:'GET', scope:'wca:read', status:'active', side_effects:false, idempotency_required:false },
  { name:'partner.read.v1', owner:'wca', route:'/api/wca/partner-detail', method:'GET', scope:'wca:read', status:'active', side_effects:false, idempotency_required:false },
  { name:'contact.search.v1', owner:'wca', route:'/api/wca/contacts', method:'GET', scope:'wca:read', status:'active', side_effects:false, idempotency_required:false },
  { name:'contact.read.v1', owner:'wca', route:'/api/wca/contacts', method:'GET', scope:'wca:read', status:'active', side_effects:false, idempotency_required:false },
  { name:'business-card.search.v1', owner:'wca', route:'/api/wca/business-cards', method:'GET', scope:'wca:read', status:'active', side_effects:false, idempotency_required:false },
  { name:'business-card.read.v1', owner:'wca', route:'/api/wca/business-cards', method:'GET', scope:'wca:read', status:'active', side_effects:false, idempotency_required:false },

  { name:'identity.company.resolve.v1', owner:'identity', route:'/api/identity/company-resolve', method:'POST', scope:'identity:resolve', status:'design', side_effects:false, idempotency_required:false },
  { name:'identity.company.read.v1', owner:'identity', route:null, method:'GET', scope:'identity:read', status:'declared', side_effects:false, idempotency_required:false },
  { name:'identity.contact.resolve.v1', owner:'identity', route:'/api/identity/contact-resolve', method:'POST', scope:'identity:resolve', status:'design', side_effects:false, idempotency_required:false },
  { name:'identity.contact.read.v1', owner:'identity', route:null, method:'GET', scope:'identity:read', status:'declared', side_effects:false, idempotency_required:false },

  { name:'email.message.search.v1', owner:'funnemail', route:'/api/email/messages', method:'GET', scope:'email:read', status:'compatibility', side_effects:false, idempotency_required:false },
  { name:'email.message.read.v1', owner:'funnemail', route:'/api/email/message', method:'GET', scope:'email:read', status:'compatibility', side_effects:false, idempotency_required:false },
  { name:'email.dashboard.v1', owner:'funnemail', route:'/api/email/dashboard', method:'GET', scope:'email:read', status:'compatibility', side_effects:false, idempotency_required:false },
  { name:'email.message.status.v1', owner:'funnemail', route:'/api/email/status', method:'POST', scope:'email:write', status:'compatibility', side_effects:true, idempotency_required:false },
  { name:'email.draft.create.v1', owner:'funnemail', route:'/api/email/drafts', method:'POST', scope:'email:write', status:'compatibility', side_effects:true, idempotency_required:true },
  { name:'email.send.v1', owner:'funnemail', route:'/api/email/send', method:'POST', scope:'email:send', status:'compatibility', side_effects:true, idempotency_required:true },
  { name:'email.sync.v1', owner:'funnemail', route:'/api/email/sync', method:'POST', scope:'email:sync', status:'compatibility', side_effects:true, idempotency_required:true },
  { name:'email.classify.v1', owner:'funnemail', route:'/api/email/classify', method:'POST', scope:'email:classify', status:'compatibility', side_effects:false, idempotency_required:false },

  { name:'communication.health.v1', owner:'bartalk', route:'/api/bartalk/health', method:'GET', scope:'communication:session', status:'active', side_effects:false, idempotency_required:false },
  { name:'communication.session.read.v1', owner:'bartalk', route:'/api/communication/session', method:'GET', scope:'communication:session', status:'active', side_effects:false, idempotency_required:false },
  { name:'communication.message.exchange.v1', owner:'bartalk', route:null, method:'POST', scope:'communication:session', status:'declared', side_effects:true, idempotency_required:true },
  { name:'translation.text.v1', owner:'bartalk', route:null, method:'POST', scope:'communication:session', status:'declared', side_effects:false, idempotency_required:false },
  { name:'translation.voice.v1', owner:'bartalk', route:null, method:'POST', scope:'communication:session', status:'declared', side_effects:false, idempotency_required:false },
  { name:'taxitalk.destination-handoff.v1', owner:'bartalk', route:null, method:'POST', scope:'communication:session', status:'declared', side_effects:true, idempotency_required:true },

  { name:'workflow.execute.v1', owner:'cobra', route:'/api/cobra/workflow', method:'POST', scope:'research:execute', status:'compatibility', side_effects:true, idempotency_required:true },
  { name:'web.research.v1', response_contract:'research.result.v1', owner:'cobra', route:'/api/research/execute', method:'POST', scope:'research:execute', status:'active', side_effects:false, idempotency_required:false },
  { name:'browser.execute.v1', owner:'cobra', route:null, method:'POST', scope:'research:execute', status:'declared', side_effects:true, idempotency_required:true },

  { name:'crm.contact.search.v1', owner:'crm', route:'/api/crm/contacts', method:'GET', scope:'crm:read', status:'extraction', side_effects:false, idempotency_required:false },
  { name:'crm.contact.read.v1', owner:'crm', route:'/api/crm/contact-detail', method:'GET', scope:'crm:read', status:'extraction', side_effects:false, idempotency_required:false },
  { name:'crm.pipeline.search.v1', owner:'crm', route:'/api/crm/pipeline', method:'GET', scope:'crm:read', status:'extraction', side_effects:false, idempotency_required:false },
  { name:'crm.activity.search.v1', owner:'crm', route:'/api/crm/activities', method:'GET', scope:'crm:read', status:'extraction', side_effects:false, idempotency_required:false },
  { name:'crm.account.search.v1', owner:'crm', route:'/api/crm/accounts', method:'GET', scope:'crm:read', status:'extraction', side_effects:false, idempotency_required:false },
  { name:'crm.opportunity.search.v1', owner:'crm', route:'/api/crm/opportunities', method:'GET', scope:'crm:read', status:'extraction', side_effects:false, idempotency_required:false },

  { name:'sales.priorities.v1', response_contract:'sales.intelligence.priorities.v1', owner:'sales-intelligence', route:'/api/sales/priorities', method:'GET', scope:'sales:read', status:'active', side_effects:false, idempotency_required:false },
  { name:'marketing.campaign.plan.v1', owner:'marketing', route:'/api/marketing/campaign-plan', method:'POST', scope:'marketing:plan', status:'active', side_effects:false, idempotency_required:false }
]);

function getCapability(name) { return CAPABILITIES.find(item => item.name === name) || null; }
function capabilitiesForOwner(owner) { return CAPABILITIES.filter(item => item.owner === owner); }
function capabilityNamesForOwner(owner) { return capabilitiesForOwner(owner).map(item => item.name); }
function responseContract(capability) { return capability?.response_contract || capability?.name || null; }

module.exports = { CAPABILITIES, getCapability, capabilitiesForOwner, capabilityNamesForOwner, responseContract };
