# Design Record: Database Migration Strategy for METR Changes

## Context

Redash is an upstream open-source project with its own migration history. METR-specific features periodically require database changes that must coexist with upstream without interfering with it.

---

## Decision

Maintain a dedicated Alembic branch (`metr_head`) for all METR database changes, separate from the upstream Redash migration chain.

---

## Rationale

### Why a Separate Branch

Inserting METR migrations directly into the upstream chain would cause the migration history to diverge when pulling upstream updates. Alembic would detect conflicting heads and refuse to upgrade, until manually resolved.

A separate branch allows:
- METR changes to evolve independently
- Upstream pulls to be absorbed through merge revisions
- Clear lineage tracking of which migrations are METR-specific vs. upstream

### Branch Lifecycle

The branch label `metr_head` is declared once on the branch root revision and inherited automatically by all descendant revisions. It never needs to be re-declared.

When upstream Redash migrations are pulled, a merge revision reconciles the two heads. After the merge, the next METR migration continues the branch by stacking on the merged head.

### Normal vs. Diverged State

- **Normal state:** One head (METR and upstream share the same tip after a merge)
- **Diverged state:** Two heads (appears temporarily after upstream pull, before merge)

Both states are valid. The steady state depends on whether the most recent operation was a METR change (one head) or an upstream pull (two heads, resolved by merge).

---

## Consequences

- METR migrations must always target `metr_head@head` to maintain branch continuity
- Upstream pulls require creating a merge revision before new METR work can continue
- Deployments must use `./manage.py db upgrade head` (single head) because upstream pulls may temporarily create multiple heads, but these are always merged before release. Production deployments must occur with exactly one head. — see the [Migration Command Reference](../migration_commands.md) under "Merging After an Upstream Pull" for more information about that.
- The branch provides clear traceability: `./manage.py db history --rev-range metr_head@base:metr_head@head` shows only METR changes

---

## Trade-offs Accepted

- Additional merge revisions after upstream pulls (adds complexity)
- Must understand Alembic branching model (steeper learning curve)
- In exchange: clean separation from upstream, no migration chain conflicts, safe upstream updates

---

See [Migration Command Reference](../migration_commands.md) for operational procedures.
