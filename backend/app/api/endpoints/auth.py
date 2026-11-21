import sqlite3
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from pwdlib import PasswordHash

from app.core.auth import (
    connect_database,
    create_access_token,
    get_current_user,
    get_jwt_secret,
)

router = APIRouter()
password_hash = PasswordHash.recommended()


class RegistrationRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegistrationRequest):
    get_jwt_secret()
    email = str(payload.email).lower()
    hashed_password = password_hash.hash(payload.password)
    try:
        with connect_database() as connection:
            cursor = connection.execute(
                "INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
                (payload.name.strip(), email, hashed_password, datetime.now(timezone.utc).isoformat()),
            )
            user = {"id": cursor.lastrowid, "name": payload.name.strip(), "email": email}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists") from None

    return {"access_token": create_access_token(email), "user": user}


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    get_jwt_secret()
    email = str(payload.email).lower()
    with connect_database() as connection:
        user = connection.execute(
            "SELECT id, name, email, password_hash FROM users WHERE email = ?", (email,)
        ).fetchone()

    if user is None or not password_hash.verify(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    return {
        "access_token": create_access_token(email),
        "user": {"id": user["id"], "name": user["name"], "email": user["email"]},
    }


@router.get("/me", response_model=UserResponse)
def current_user(user: dict = Depends(get_current_user)):
    return user


@router.post("/forgot-password", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def forgot_password():
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Password reset delivery is not configured. Please contact support.",
    )