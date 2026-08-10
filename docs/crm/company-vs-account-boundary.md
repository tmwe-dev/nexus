# CRM Company vs Account Boundary

## Rule

A **Company** is an identity/factual entity resolved by Nexus Identity and source connectors.
A **CRM Account** is the commercial relationship that CRM owns for that company.

These are intentionally separate.

## Migration behavior from Navigator

Navigator currently groups `imported_contacts` into company-like UI entities using company name or email domain. That behavior is useful for presentation but is not sufficient to establish company identity.

During migration Nexus may expose a temporary account projection with these priorities:

1. `wca_partner_id` -> strong federated company reference;
2. normalized `company_name` -> migration-only grouping candidate;
3. email domain -> weak migration-only grouping candidate;
4. otherwise one temporary account per contact.

Only case 1 produces an authoritative external identity reference. The other cases remain marked `migration_projection=true` until Nexus Identity resolves them.

## Ownership

- CRM owns: account owner, pipeline state, commercial notes/tags, relationship activity references and sales score.
- WCA owns: WCA member/company source facts.
- Report Aziende will own: Italian corporate/legal source facts.
- COBRA owns/reports research evidence produced by its workflows.
- Funnemail owns mailbox/message contents.
- BarTalk owns communication-session content.
- Nexus Identity owns federation links, provenance and match confidence.

## Safety

This module is read-only against Navigator during migration. It does not create, update, merge or delete any record in an original system.
