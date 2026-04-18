from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
from fastapi import HTTPException, status
import jwt

from database import get_settings

SECRET_KEY = get_settings().SECRET_KEY
ALGORITHM = "HS256"


class TokenData(BaseModel):
    email: str
    role: str
    exp_datetime: datetime


def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=20)):
    payload = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    payload.update({"exp": expire.timestamp()})

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token, expire


def verify_access_token(token: str) -> TokenData:
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        exp = data.get("exp")
        if exp is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No access token supplied. Invalid token: no expiration",
            )

        exp_datetime = (
            datetime.fromtimestamp(exp, tz=timezone.utc)
            if isinstance(exp, int)
            else exp
        )

        return TokenData(
            email=data.get("email"),
            role=data.get("role"),
            exp_datetime=exp_datetime,
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token expired",
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
