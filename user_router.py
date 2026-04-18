from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated

from models import User
from auth.hash_password import hash_password, verify_password
from auth.jwt_handler import create_access_token

user_router = APIRouter()

@user_router.post("/signup")
async def sign_user_up(user: User) -> dict:
    db_user = await User.find_one(User.email == user.email)

    if db_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with email provided exists already.",
        )
    user = await User.find_one(User.email == email)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect password")
        user.password = hash_password(user.password)

    await user.insert()
    return {"message": "User created successfully"}


@user_router.post("/sign-in")
async def sign_in(
    user: Annotated[OAuth2PasswordRequestForm, Depends()],
):

    db_user = await User.find_one(User.email == user.username)

    if not db_user or not db_user.active:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token, expiry = create_access_token(
        {
            "email": db_user.email,
            "role": str(db_user.role) if hasattr(db_user, "role") else "user",
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expiry": expiry,
    }
