from flask import flash, redirect, render_template, request, url_for
from flask_login import (
    LoginManager,
    current_user,
    login_required,
    login_user,
    logout_user,
)

from redash_global.models import GlobalAdminUser

login_manager = LoginManager()
login_manager.login_view = "global.login"
login_manager.login_message = None


@login_manager.user_loader
def load_user(user_id):
    return GlobalAdminUser.query.get(user_id)


def login_page():
    if current_user.is_authenticated:
        return redirect(url_for("global.index"))

    if request.method == "POST":
        username = request.form.get("username", "")
        password = request.form.get("password", "")
        user = GlobalAdminUser.get_by_username(username)
        if user and user.verify_password(password):
            login_user(user)
            return redirect(url_for("global.index"))
        flash("Wrong username or password.")

    return render_template("login.html", username=request.form.get("username", ""))


@login_required
def logout_page():
    logout_user()
    return redirect(url_for("global.login"))
