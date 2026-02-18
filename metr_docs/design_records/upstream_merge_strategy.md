# Design Record: Upstream Redash Merge Strategy

## Context

METR maintains a fork of Redash (`metr-main`) that diverges from upstream with METR-specific features, configuration, and database migrations. Periodically, upstream Redash releases must be pulled in to stay current with bug fixes and new functionality. This process needs to be reliable, repeatable, and safe — it must not break METR-specific changes or create an inconsistent migration state.

---

## Decision

Use a dedicated short-lived merge branch to absorb upstream changes before they land on `metr-main`. The merge branch is created from `metr-main`, the upstream tag is merged into it, verification happens there, and only a clean result is merged back.

---

## Why a Merge Branch

Merging directly into `metr-main` would expose the main branch to conflicts and broken states during resolution. A merge branch isolates the risk — `metr-main` only receives the result once it is known to be working. It also produces a clean PR that makes the merge reviewable.

---

## Workflow

### Phase 1 — Preparation

Fetch the upstream release and create the merge branch from the current `metr-main`.

```bash
git fetch upstream --tags
git checkout metr-main
git pull origin metr-main
git checkout -b merge-v<VERSION>
```

### Phase 2 — Merge

Pull the upstream release tag into the merge branch.

```bash
git merge v<VERSION>
```

If the output is "Fast-forward", the phase is done. If there are conflicts, resolve them file by file — typically this means preserving the upstream change while reapplying any METR-specific config or override — then stage and commit:

```bash
git add <file>
git commit   # accept the default merge message
```

### Phase 3 — Verification

Before the merge branch is considered ready, all of the following must pass.

#### Python dependencies

If `pyproject.toml` changed, refresh the lockfile:

```bash
poetry lock --no-update
poetry check --lock
poetry install
```

#### JavaScript dependencies

If `package.json` changed:

```bash
yarn install
```

#### Database migration state

Check for conflicting heads and resolve any conflicts introduced by the upstream pull. When upstream includes new migrations the upstream head advances and a merge revision is required — see the [Migration Command Reference](../migration_commands.md) under "Merging After an Upstream Pull" for the exact commands. The reasoning behind the branch structure is in the [Database Migration Strategy design record](db_migration_strategy.md).
#### Formatting and pre-commit hooks

```bash
yarn prettier
pre-commit run --all-files
```

#### Tests

Run the full test suite and confirm it passes before proceeding.

### Phase 4 — Merge Back to `metr-main`

Either open a PR from the merge branch and merge after review, or merge directly:

```bash
git checkout metr-main
git merge merge-v<VERSION>
```

### Phase 5 — Tag and Push

```bash
git tag v<VERSION>-metr-r1
git push origin metr-main --tags
```

Clean up the working branch:

```bash
git branch -d merge-v<VERSION>
```

---

## Consequences

- `metr-main` only ever receives working, verified merges
- The merge branch is throwaway — its only job is to absorb the conflict and prove the result is clean
- The version tag on `metr-main` (`-metr-r1` suffix) makes it clear which upstream release the deployment is based on and that it carries METR changes
- Database conflicts introduced by upstream pulls are resolved in Phase 3
