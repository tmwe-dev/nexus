const { migrationReadiness } = require('./readiness');

const CAPABILITY_MIGRATIONS = [
  { capability: 'crm.contact.search.v1', source: 'navigator', target: 'nexus', contract_compatible: true, shadow_acceptable: false, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'crm.contact.read.v1', source: 'navigator', target: 'nexus', contract_compatible: true, shadow_acceptable: false, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'crm.pipeline.search.v1', source: 'navigator', target: 'nexus', contract_compatible: true, shadow_acceptable: false, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'crm.activity.search.v1', source: 'navigator', target: 'nexus', contract_compatible: true, shadow_acceptable: false, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'crm.account.search.v1', source: 'navigator', target: 'nexus', contract_compatible: true, shadow_acceptable: false, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'crm.opportunity.search.v1', source: 'navigator', target: 'nexus', contract_compatible: true, shadow_acceptable: false, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'sales.priorities.v1', source: 'navigator', target: 'nexus', contract_compatible: true, shadow_acceptable: false, callers_migrated: false, rollback_ready: true, observability_ready: true },
  { capability: 'marketing.campaign.plan.v1', source: 'navigator', target: 'nexus', contract_compatible: true, shadow_acceptable: false, callers_migrated: false, rollback_ready: true, observability_ready: true },
  { capability: 'research.execute.v1', source: 'cobra-compatibility', target: 'nexus', contract_compatible: true, shadow_acceptable: false, callers_migrated: false, rollback_ready: true, observability_ready: true }
];

function listCapabilityMigrations() {
  return CAPABILITY_MIGRATIONS.map(item => ({ ...item, readiness: migrationReadiness(item) }));
}

function getCapabilityMigration(capability) {
  const item = CAPABILITY_MIGRATIONS.find(entry => entry.capability === capability);
  return item ? { ...item, readiness: migrationReadiness(item) } : null;
}

module.exports = { CAPABILITY_MIGRATIONS, listCapabilityMigrations, getCapabilityMigration };
