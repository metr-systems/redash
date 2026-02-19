# Migration Command Reference

Redash uses **Flask-Migrate**, which wraps Alembic behind `./manage.py db`.
Always use this entrypoint — never bare `alembic` or `flask db` commands:

- **`alembic` directly** — bypasses the Flask app context entirely, so `REDASH_DATABASE_URL` is never loaded and models are unavailable
- **`flask db`** — requires `FLASK_APP` to be set and does not go through `manage.py`'s `create_app()` path, so Redash's config and settings module are not initialised correctly

All standard Alembic flags (`--branch-label`, `--head`, `--rev-range`, etc.)
pass through to Alembic unchanged.

For the reasoning behind the `metr_head` branch structure and when to merge
with upstream, see the [metr_head Migration Branch design record](./design_records/db_migration_strategy.md)

---

## Inspecting State

```bash
# Show all current heads 
# Will list both upstream Redash and metr_head only when the migration
# history has diverged (e.g., immediately after pulling upstream).
# After the divergence is resolved via a merge revision, it should show
# only a single head.
./manage.py db heads

# Show the revision currently applied to the database:
./manage.py db current

# Show full history of the metr_head branch:
./manage.py db history --rev-range metr_head@base:metr_head@head

# Inspect a specific revision:
./manage.py db show <revision_id>
```

---

## Creating Migrations


## Model-First Development Pattern

The recommended workflow is **model-first with autogenerate**:

1. **Define the ORM model** in `redash/models/__init__.py`
   - Use SQLAlchemy declarative syntax
   - Declare constraints, indexes, relationships

2. **Generate the migration**
```bash
   ./manage.py db revision --head metr_head@head --autogenerate -m "description"
```

3. **Review and fix the generated migration**

4. **Apply the migration**
```bash
   ./manage.py db upgrade metr_head@head
```

**Important:** Do not use `--branch-label metr_head` when stacking on an existing branch. The label already exists on the branch root (`6f3ff3d0dd48`) and is inherited automatically. Passing `--branch-label` again will cause Alembic to throw a `RevisionError: Branch name 'metr_head' ... already used`.

The `--branch-label` flag is only for creating a **new** branch root from scratch, which is not applicable here.

---

## Applying & Rolling Back

```bash
# Apply only the metr_head branch:
./manage.py db upgrade metr_head@head

# Roll back the metr_head branch by one step:
./manage.py db downgrade metr_head@-1

# Roll back the entire metr_head branch:
./manage.py db downgrade metr_head@base
```

> **Gotcha:** `./manage.py db upgrade` with no argument defaults to `head` (singular).
> If multiple heads exist (for example, immediately after pulling upstream),
> it will fail. In this repository, the correct workflow is to create a merge
> revision first so the migration graph returns to a single head, then run
> `./manage.py db upgrade head`. (details in next paragraph)

---

## Merging After an Upstream Pull

Run this procedure every time you pull upstream Redash and it includes new migrations.

```bash
# 1. Pull upstream and rebase/merge your git branch as normal.
#    After this, ./manage.py db heads will show a NEW upstream head
#    alongside your existing metr_head.

# 2. Check what the new upstream head ID is:
./manage.py db heads
#    Example output:
#      abc123def456 (head)          ← new upstream head
#      a1b2c3d4e5f6 (metr_head) (head)

# 3. Create a merge revision that reconciles the upstream head and metr_head into a single head:
./manage.py db merge \
  -m "merge_upstream_into_metr_head" \
  abc123def456 metr_head@head
#    This generates a new migration file with:
#      down_revision = ('abc123def456', 'a1b2c3d4e5f6')
#      branch_labels = None   ← intentional, it's just a merge point

# 4. Apply it:
./manage.py db upgrade head #  ← single head after merge

# 5. Resume normal metr development by stacking on top of metr_head:
./manage.py db revision \
  --head metr_head@head \
  -m "your_description"
```

---

## Quick Reference Card

| Goal | Command |
|---|---|
| See all heads | `./manage.py db heads` |
| See DB state | `./manage.py db current` |
| Create new migration on metr_head | `./manage.py db revision --head metr_head@head --autogenerate -m "..."` |
| Merge after upstream pull | `./manage.py db merge -m "merge_upstream_into_metr_head" <upstream_head> metr_head@head` |
| Apply metr branch only | `./manage.py db upgrade metr_head@head` |
| Deploy the one head | `./manage.py db upgrade` |
| Roll back one step | `./manage.py db downgrade metr_head@-1` |
| Roll back entire metr branch | `./manage.py db downgrade metr_head@base` |
