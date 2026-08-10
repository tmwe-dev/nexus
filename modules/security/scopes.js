const SCOPES = Object.freeze({
  CRM_READ: 'crm:read',
  CRM_WRITE: 'crm:write',
  WCA_READ: 'wca:read',
  RESEARCH_EXECUTE: 'research:execute',
  AI_EXECUTE: 'ai:execute',
  MARKETING_PLAN: 'marketing:plan',
  EMAIL_READ: 'email:read',
  EMAIL_SEND: 'email:send',
  COMMUNICATION_SESSION: 'communication:session',
  MIGRATION_READ: 'migration:read',
  MIGRATION_WRITE: 'migration:write',
  CUTOVER_PLAN: 'migration:cutover',
  OPERATIONS_READ: 'operations:read'
});

module.exports = { SCOPES };
