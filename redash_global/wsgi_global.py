"""WSGI entrypoint for Redash Global service.

This file can be used with WSGI servers like Gunicorn:
    gunicorn redash_global.wsgi_global:app
"""

from .app import create_global_app

app = create_global_app()
