def test_unauthenticated_index_redirects_to_login(client):
    response = client.get("/")

    assert response.status_code == 302
    assert "/login" in response.headers["Location"]


def test_login_with_valid_credentials_sets_session_and_redirects(client, admin):
    response = client.post("/login", data={"username": "admin", "password": "secret"})

    assert response.status_code == 302
    assert response.headers["Location"].endswith("/")

    # The session persists, so / is now served instead of redirecting.
    assert client.get("/").status_code == 200


def test_login_with_invalid_credentials_shows_error(client, admin):
    response = client.post("/login", data={"username": "admin", "password": "wrong"})

    assert response.status_code == 200
    assert b"Wrong username or password" in response.data


def test_logout_clears_session_and_redirects_to_login(admin_client):
    response = admin_client.get("/logout")

    assert response.status_code == 302
    assert "/login" in response.headers["Location"]

    # The session is gone, so / redirects to /login again.
    index = admin_client.get("/")
    assert index.status_code == 302
    assert "/login" in index.headers["Location"]
