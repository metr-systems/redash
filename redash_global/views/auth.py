from flask import flash, redirect, render_template, request, send_file, url_for
from flask_login import current_user, login_user, logout_user
from werkzeug.utils import safe_join

from redash import settings
from redash_global.models import GlobalAdminUser


def login_page():
    if current_user.is_authenticated:
        return redirect(url_for("api.admin_ui"))

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        user = GlobalAdminUser.get_by_username(username)
        if not user or not user.verify_password(password):
            flash("Invalid credentials")
            return render_template("login.html")

        login_user(user)
        return redirect(url_for("api.admin_ui"))

    return render_template("login.html")


def logout_view():
    logout_user()
    return redirect(url_for("api.login_page"))


def admin_ui_view():
    if not current_user.is_authenticated:
        return redirect(url_for("api.login_page"))
    full_path = safe_join(settings.STATIC_ASSETS_PATH, "global.html")
    return send_file(full_path, max_age=0, conditional=True)


def admin_ui_catchall(path=""):
    if not current_user.is_authenticated:
        return redirect(url_for("api.login_page"))
    full_path = safe_join(settings.STATIC_ASSETS_PATH, "global.html")
    return send_file(full_path, max_age=0, conditional=True)
