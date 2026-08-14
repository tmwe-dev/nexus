# Funnemail Boundary — Nexus-owned copy

This directory is the canonical source for the Funnemail integration boundary used by TMWE Nexus.

## Rule

The original Funnemail repository/application is a source of truth and is treated as read-only unless the owner explicitly orders a change to that original system.

Future Nexus integration work must therefore happen here (or in another Nexus-owned service), not by editing Funnemail application files.

## Deployment location

The function is deployed into the Funnemail Supabase project because it must execute inside the Funnemail security/data boundary and preserve user RLS semantics.

Current deployed function name:

- `funnemail-nexus-v1`

Current auth model:

- `verify_jwt=false` at the Edge wrapper;
- the function validates the delegated Funnemail user JWT using `auth.getUser`;
- mailbox/data access uses the anon key plus the verified user JWT;
- no service-role key is exposed to Nexus browser clients;
- no shared Nexus service secret is required for the six current user-scoped capabilities.

## Current contracts

- `email.message.search.v1`
- `email.message.read.v1`
- `email.draft.create.v1`
- `email.send.v1`
- `email.sync.v1`
- `email.classify.v1`

## Source-of-truth transition

An earlier implementation copy exists on a Funnemail feature branch and the active Supabase deployment was originally deployed from that copy. That branch is historical migration material only and must not become the ongoing development path.

Before the next boundary deployment:

1. compare this Nexus-owned source with the active function;
2. deploy from this directory/source;
3. record the deployed hash/version in Nexus durable state;
4. continue all subsequent integration changes from Nexus-owned code.

## Compatibility

Nexus still contains compatibility adapters for Funnemail operations that are not yet exposed through this boundary. Do not delete those adapters until the replacement capability exists and migration/conformance/rollback gates pass.
