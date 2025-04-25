from datetime import datetime, timedelta, timezone
import jwt
from pydantic import BaseModel

from api.models.my_config import get_settings


class LoginResult(BaseModel):
    username: str
    role: str
    access_token: str
    token_type: str = "bearer"


class Token(BaseModel):
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
    key = get_settings().secret_key
    encoded = jwt.encode(payload, key, algorithm=ALGORITHM)
    return encoded


def decode_jwt_token(token: str) -> TokenData | None:
    try:
        key = get_settings().secret_key
        payload = jwt.decode(token, key, algorithms=[ALGORITHM])
        username: str = payload.get("username")
        role: str = payload.get("role", "")
        exp: int = payload.get("exp")
        return TokenData(
            username=username, role=role, exp_datetime=datetime.fromtimestamp(exp)
        )
    except jwt.InvalidTokenError:
        return None
