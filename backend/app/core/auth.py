import os
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from dotenv import load_dotenv
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)
DEFAULT_DATABASE_PATH = Path(__file__).resolve().parents[2] / "data" / "auth.sqlite3"


def get_jwt_secret() -> str:
    load_dotenv(Path(__file__).resolve().parents[2] / ".env")
    secret = os.getenv("JWT_SECRET_KEY", "")
    if len(secret) < 32:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is not configured. Set JWT_SECRET_KEY to a secret of at least 32 characters.",
        )
    return secret


def get_database_path() -> Path:
    return Path(os.getenv("AUTH_DATABASE_PATH", str(DEFAULT_DATABASE_PATH)))


def connect_database() -> sqlite3.Connection:
    database_path = get_database_path()
    database_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(database_path)
    connection.row_factory = sqlite3.Row
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE COLLATE NOCASE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    return connection


def create_access_token(email: str) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": email, "iat": now, "exp": now + timedelta(minutes=30)},
        get_jwt_secret(),
        algorithm="HS256",
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, Any]:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            get_jwt_secret(),
            algorithms=["HS256"],
        )
        email = payload.get("sub")
        if not isinstance(email, str):
            raise jwt.InvalidTokenError("Missing subject")
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    with connect_database() as connection:
        user = connection.execute(
            "SELECT id, name, email FROM users WHERE email = ?", (email,)
        ).fetchone()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return dict(user)