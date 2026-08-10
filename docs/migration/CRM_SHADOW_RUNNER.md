# CRM Shadow Runner

Nexus now exposes an operational read-only shadow runner at `/api/shadow/crm`.

It compares Nexus CRM projections against the same Navigator source records without changing Navigator or any source dataset.

Current executable checks:
- `crm.contact.search.v1`
- `crm.account.search.v1`
- `crm.pipeline.search.v1`
- `crm.activity.search.v1` when a contact id is supplied

The runner intentionally does **not** mutate migration readiness. A successful runtime comparison is evidence for the `shadow_acceptable` gate, but the gate must only be promoted after repeatable deployed-environment runs are reviewed.

Identity-only Nexus metadata is excluded where appropriate because it is an intentional enrichment rather than a legacy field.

A failed or skipped check never counts as accepted evidence.

Original applications remain untouched/read-only.
