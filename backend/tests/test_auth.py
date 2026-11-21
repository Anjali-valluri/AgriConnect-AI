import sqlite3

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.endpoints.auth import router


def test_registration_login_and_protected_profile(tmp_path, monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-with-more-than-thirty-two-characters")
    monkeypatch.setenv("AUTH_DATABASE_PATH", str(tmp_path / "users.sqlite3"))
    app = FastAPI()
    app.include_router(router, prefix="/auth")
    client = TestClient(app)

    registration = client.post(
        "/auth/register",
        json={"name": "Asha Farmer", "email": "asha@example.com", "password": "secure-pass-123"},
    )
    assert registration.status_code == 201
    token = registration.json()["access_token"]
    assert registration.json()["user"]["email"] == "asha@example.com"
    with sqlite3.connect(tmp_path / "users.sqlite3") as connection:
        stored_password = connection.execute(
            "SELECT password_hash FROM users WHERE email = ?", ("asha@example.com",)
        ).fetchone()[0]
    assert stored_password.startswith("$argon2id$")
    assert stored_password != "secure-pass-123"

    duplicate = client.post(
        "/auth/register",
        json={"name": "Asha Farmer", "email": "asha@example.com", "password": "secure-pass-123"},
    )
    assert duplicate.status_code == 409

    login = client.post(
        "/auth/login",
        json={"email": "asha@example.com", "password": "secure-pass-123"},
    )
    assert login.status_code == 200

    assert client.get("/auth/me").status_code == 401
    profile = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert profile.status_code == 200
    assert profile.json()["name"] == "Asha Farmer"

    invalid_login = client.post(
        "/auth/login",
        json={"email": "asha@example.com", "password": "wrong-password"},
    )
    assert invalid_login.status_code == 401