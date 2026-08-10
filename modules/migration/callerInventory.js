const CALLERS = [
  { capability: 'crm.contact.search.v1', source: 'navigator', caller: 'src/v2/ui/pages/ContactsPage.tsx', path_kind: 'page', migrated: false },
  { capability: 'crm.contact.search.v1', source: 'navigator', caller: 'src/v2/hooks/companyList/useCrmContactsAsCompanies.ts', path_kind: 'hook', migrated: false },
  { capability: 'crm.contact.search.v1', source: 'navigator', caller: 'src/hooks/useContactListPanel.ts', path_kind: 'hook', migrated: false },
  { capability: 'crm.contact.search.v1', source: 'navigator', caller: 'src/hooks/useContactsPaginated.ts', path_kind: 'data-hook', migrated: false }
];

function listCallers(capability) {
  return CALLERS.filter(item => !capability || item.capability === capability);
}

function callerSummary(capability) {
  const items = listCallers(capability);
  const active = items.filter(item => !item.migrated);
  return {
    contract: 'migration.caller-inventory.v1',
    capability: capability || null,
    total_known_callers: items.length,
    active_callers: active.length,
    all_migrated: items.length > 0 && active.length === 0,
    items
  };
}

module.exports = { CALLERS, listCallers, callerSummary };
