from beanie import Document
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class User(Document):
    username: str
    email: str
    password: str  # hashed & salted password in the database
    role: str = "user"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

    class Settings:
        name = "users"  # collection name in MongoDB

    class Config:
        arbitrary_types_allowed = True


class UserRequest(BaseModel):
    username: str
    email: str
    password: str  # plain text from user input


class UserResponse(BaseModel):
    username: str
    email: str
    role: str = "user"
    created_at: datetime = None
    last_login: Optional[datetime] = None