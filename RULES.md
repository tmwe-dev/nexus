# TMWE Nexus — Authoritative Rules

This file is the authoritative operating constitution for TMWE Nexus.

**Priority rule:** if another project document conflicts with this file, `RULES.md` wins unless the owner explicitly gives a newer instruction.

These rules apply to ChatGPT, Codex, Claude, Lovable and any other agent or developer working on Nexus.

---

## 1. Source systems are immutable

Legacy/original repositories and running applications are **sources of truth** and must be treated as **read-only** unless the owner explicitly orders a change to that specific original system.

It is forbidden to modify, refactor, clean up, delete, migrate, rename or "fix" code directly inside an original repository merely to make Nexus work.

When Nexus needs behavior, logic, data interpretation or functionality from a legacy/original system:

1. read and understand the original source;
2. identify the real behavior and dependencies;
3. copy, port, adapt or reimplement the required code/logic inside the new TMWE/Nexus infrastructure;
4. make all fixes, simplifications and refactors in the new implementation;
5. leave the original source unchanged.

The original remains available for comparison, rollback and verification until the migration gates are fully satisfied.

---

## 2. Continue autonomously until the requested objective is complete

When the owner instructs the agent to **build the system, proceed, continue, finish, complete the work, or work until the objective is reached**, that instruction remains active until one of the following occurs:

- the requested objective is demonstrably complete;
- the owner changes or cancels the objective;
- a genuinely blocking external dependency requires information or access that cannot be obtained with the available tools;
- continuing would violate a safety, security or explicit production-protection rule.

The agent must **not stop merely to ask permission to continue**, must not repeatedly ask "shall I proceed?", and must not require approval between normal implementation phases, files, batches, audits, fixes or verification steps already implied by the objective.

The agent should make reasonable technical decisions autonomously, choosing the safest reversible path that preserves the requested architecture and functionality.

### Session continuity

A tool, runtime, context or chat session ending does **not** cancel the original instruction to proceed to completion.

On the next available invocation/session, the agent must:

1. recover the current repository/project state;
2. identify the last completed step and remaining work;
3. resume from that point automatically;
4. avoid asking the owner to repeat information already available in the repository, project state or prior work;
5. continue until the objective is complete or a genuine blocker is reached.

The agent cannot self-start a new external ChatGPT/Codex session without a platform trigger, but once a new session/invocation exists it must resume automatically under this rule.

For long-running work, progress and remaining blockers should be persisted in repository documentation or other durable project state so the next session can continue without reconstruction from memory.

---

## 3. Independent applications, shared contracts

1. Applications remain independently operable.
2. Each capability has one primary owner.
3. Each datum has one authoritative source.
4. Services do not read another service's private database directly.
5. Cross-service calls use public, versioned contracts.
6. Cobra orchestrates workflows; it does not absorb domain business logic.
7. Navigator consumes capabilities and presents intelligence.
8. Optional/enhancing dependency failures degrade gracefully.
9. Side-effecting commands are idempotent.
10. No production data or secrets are committed to GitHub.
11. No big-bang migration.
12. TMWE2 is integrated last unless the owner explicitly changes the migration order.

---

## 4. Migration and deprecation safety

A legacy capability is not removed merely because a replacement exists.

Deprecation requires all mandatory gates to pass:

1. contract compatibility;
2. acceptable shadow/conformance comparison;
3. active callers migrated;
4. rollback ready;
5. observability ready.

Only full readiness authorizes deprecation/removal.

Rollback must not require mutation of original source data.

---

## 5. User experience rule

**Complexity belongs in the backend, not in the normal user interface.**

The normal operator UI must expose business objects, actions and results — not internal implementation concepts.

Technical concepts such as capability registries, adapters, runtime internals, service boundaries, migration gates, scopes, idempotency internals, Supabase details, endpoint names and routing diagnostics belong in administration/system diagnostics, not in the primary user workflow.

The preferred UI is compact, understandable and task-oriented, with the minimum number of visible choices required to complete the user's job.

---

## 6. Production protection

Production changes must be deliberate and reversible.

Do not expose secrets in client-side code or GitHub.
Do not put service-role credentials in browsers.
Do not bypass authentication, authorization, RLS or data-ownership boundaries for convenience.
Do not silently replace an original data source before conformance and rollback gates pass.

When a production-affecting operation is already explicitly included in the owner's instruction, the agent should execute it without repeatedly asking for permission, while still respecting irreversible/destructive-action safeguards and all rules in this file.

---

## 7. Preserve working functionality while simplifying

Simplification must remove unnecessary complexity, duplication and routing ambiguity without accidentally removing required business behavior.

Before deleting or replacing code:

- identify active callers;
- identify the source of truth;
- verify the replacement path;
- preserve rollback where required.

Do not keep obsolete complexity merely because it already exists, but do not delete working behavior without understanding what depends on it.

---

## 8. Related documents

The following documents provide detailed implementation policy and remain valid where they do not conflict with this file:

- `docs/ARCHITECTURE.md`
- `docs/MIGRATION_GATES.md`
- `docs/GRACEFUL_DEGRADATION_MATRIX.md`
- service boundary documents under `docs/services/`
