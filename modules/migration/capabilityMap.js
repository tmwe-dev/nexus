const { migrationReadiness } = require('./readiness');

const CAPABILITY_MIGRATIONS = [
  { capability: 'crm.contact.search.v1', source: 'navigator', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: 'crm', callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'crm.contact.read.v1', source: 'navigator', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: 'manual-detail', callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'crm.pipeline.search.v1', source: 'navigator', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: 'crm', callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'crm.activity.search.v1', source: 'navigator', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: 'crm-with-contact-id', callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'crm.account.search.v1', source: 'navigator', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: 'crm', callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'crm.opportunity.search.v1', source: 'navigator', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: false },

  { capability: 'email.message.search.v1', source: 'funnemail', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'email.message.read.v1', source: 'funnemail', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'email.dashboard.v1', source: 'funnemail', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'email.message.status.v1', source: 'funnemail', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'email.draft.list.v1', source: 'funnemail', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'email.draft.create.v1', source: 'funnemail', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'email.draft.action.v2', source: 'funnemail', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'email.send.v1', source: 'funnemail', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'email.sync.v1', source: 'funnemail', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'email.classify.v1', source: 'funnemail', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'email.reclassify.v1', source: 'funnemail', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'email.tasks.v2', source: 'funnemail', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'email.task.create.v2', source: 'funnemail', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'email.senders.v1', source: 'funnemail', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'email.rules.v1', source: 'funnemail', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'email.rules.apply.v1', source: 'funnemail', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'email.compose.v2', source: 'funnemail', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'email.sender-intel.v1', source: 'funnemail', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: false },
  { capability: 'email.enrich.v1', source: 'funnemail', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: false },

  { capability: 'sales.priorities.v1', source: 'navigator', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: true },
  { capability: 'marketing.campaign.plan.v1', source: 'navigator', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: true },
  { capability: 'web.research.v1', source: 'cobra-compatibility', target: 'nexus', contract_compatible: true, shadow_acceptable: false, shadow_runner: null, callers_migrated: false, rollback_ready: true, observability_ready: true }
];

function listCapabilityMigrations() {
  return CAPABILITY_MIGRATIONS.map(item => ({ ...item, readiness: migrationReadiness(item) }));
}

function getCapabilityMigration(capability) {
  const item = CAPABILITY_MIGRATIONS.find(entry => entry.capability === capability);
  return item ? { ...item, readiness: migrationReadiness(item) } : null;
}

module.exports = { CAPABILITY_MIGRATIONS, listCapabilityMigrations, getCapabilityMigration };
