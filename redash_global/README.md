# Redash Global

A small, standalone Flask app for cross-organization ("global") administration,
running alongside the main Redash app. It shares Redash's PostgreSQL database and
models but is a **separate application** with its own session cookie, signed by a
dedicated `GLOBAL_SECRET_KEY`.

## Configuration

`GLOBAL_SECRET_KEY` is **required** — the app refuses to start without it. It must
differ from the main Redash app's secret. The database connection is inherited
from Redash's settings (`SQLALCHEMY_DATABASE_URI`), so no separate DB config is needed.

## Running CLI commands

CLI commands (`create_global_admin`, `update_global_admin_password`) are registered
on the global app, so the `flask` CLI must be told to load it via `FLASK_APP`.

### Locally

```bash
env FLASK_APP=redash_global.wsgi_global flask create_global_admin <username> --password <password>
```

Omit `--password` to be prompted for it interactively.


### In staging (Kubernetes)

`GLOBAL_SECRET_KEY` is already in the pod's environment, so only prepend `FLASK_APP`:

```bash
kube staging exec -it <global-pod> -- \
  env FLASK_APP=redash_global.wsgi_global \
  flask create_global_admin <username> --password <password>
```
