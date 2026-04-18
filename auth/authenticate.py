from auth.jwt_handler import TokenData, verify_access_token
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/sign-in")


async def authenticate(token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Sign in required")

    token_data = verify_access_token(token)

    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    return token_data