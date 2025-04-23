from datetime import datetime, timedelta, timezone
import jwt
from pydantic import BaseModel

from models.my_config import get_setting


class LoginResult(BaseModel):
    username: str
    password: str
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: str
    role: str
    exp_datetime: datetime


ALGORITHM = "HS256"


def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=15)):
    payload = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    payload.update({"exp": expire})
    key = get_setting().secret_key
    encoded = jwt.encode(payload, key, algorithm=ALGORITHM)
    return encoded


def decode_jwt_token(token: str) -> TokenData | None:
    try:
        key = get_setting().secret_key
        payload = jwt.decode(token, key, algorithms=[ALGORITHM])
        print(payload)
        username: str = payload.get("username")
        exp: int = payload.get("exp")
        return TokenData(username=username, exp_datetime=datetime.fromtimestamp(exp))
    except jwt.InvalidTokenError:
        print("Invalid JWT token.")