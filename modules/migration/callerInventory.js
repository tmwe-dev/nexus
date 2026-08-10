const CALLERS = [
  { capability: 'crm.contact.search.v1', source: 'navigator', caller: 'src/v2/ui/pages/ContactsPage.tsx', path_kind: 'page', migrated: false, evidence: 'verified_code_search' },
  { capability: 'crm.contact.search.v1', source: 'navigator', caller: 'src/v2/hooks/companyList/useCrmContactsAsCompanies.ts', path_kind: 'hook', migrated: false, evidence: 'verified_code_search' },
  { capability: 'crm.contact.search.v1', source: 'navigator', caller: 'src/hooks/useContactListPanel.ts', path_kind: 'hook', migrated: false, evidence: 'verified_code_search' },
  { capability: 'crm.contact.search.v1', source: 'navigator', caller: 'src/hooks/useContactsPaginated.ts', path_kind: 'data-hook', migrated: false, evidence: 'verified_code_search' },
  { capability: 'crm.contact.read.v1', source: 'navigator', caller: 'src/components/contacts/ContactDetailPanel.tsx', path_kind: 'panel', migrated: false, evidence: 'verified_code_search' },
  { capability: 'crm.contact.read.v1', source: 'navigator', caller: 'src/hooks/useContactDetail.ts', path_kind: 'hook', migrated: false, evidence: 'verified_code_search' },
  { capability: 'crm.pipeline.search.v1', source: 'navigator', caller: 'src/components/contacts/ContactPipelineView.tsx', path_kind: 'view', migrated: false, evidence: 'verified_code_search' },
  { capability: 'crm.account.search.v1', source: 'navigator', caller: 'src/v2/hooks/companyList/useCrmContactsAsCompanies.ts', path_kind: 'legacy-company-projection', migrated: false, evidence: 'verified_code_search' },
  { capability: 'crm.activity.search.v1', source: 'navigator', caller: 'src/components/contacts/ContactInteractionTimeline.tsx', path_kind: 'timeline', migrated: false, evidence: 'verified_code_search' },
  { capability: 'crm.activity.search.v1', source: 'navigator', caller: 'src/data/contacts/interactions.ts', path_kind: 'data-module', migrated: false, evidence: 'verified_code_search' },
  { capability: 'crm.activity.search.v1', source: 'navigator', caller: 'supabase/functions/_shared/toolHandlersReadCrm.ts', path_kind: 'ai-tool-handler', migrated: false, evidence: 'verified_code_search' }
];

const INVENTORY_STATUS = {
  'crm.contact.search.v1': 'verified_initial_scope',
  'crm.pipeline.search.v1': 'verified_initial_scope',
  'crm.account.search.v1': 'verified_initial_scope',
  'crm.contact.read.v1': 'verified_initial_scope',
  'crm.activity.search.v1': 'verified_initial_scope',
  'crm.opportunity.search.v1': 'derived_capability_no_direct_legacy_equivalent'
};

function listCallers(capability) {
  return CALLERS.filter(item => !capability || item.capability === capability);
}

function callerSummary(capability) {
  const items = listCallers(capability);
  const active = items.filter(item => !item.migrated);
  const status = capability ? (INVENTORY_STATUS[capability] || 'discovery_required') : 'mixed';
  const derivedNoLegacy = status === 'derived_capability_no_direct_legacy_equivalent';
  return {
    contract: 'migration.caller-inventory.v1',
    capability: capability || null,
    inventory_status: status,
    total_known_callers: items.length,
    active_callers: active.length,
    all_migrated: derivedNoLegacy || (items.length > 0 && active.length === 0 && status !== 'discovery_required'),
    items
  };
}

module.exports = { CALLERS, INVENTORY_STATUS, listCallers, callerSummary };
