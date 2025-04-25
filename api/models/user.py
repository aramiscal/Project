from beanie import Document
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class User(Document):
    username: str
    email: str
    password: str  # hashed & salted password in the database
    role: str = "user"
    # Make created_at truly optional with a default factory
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

    class Settings:
        name = "users"  # collection name in MongoDB

    class Config:
        arbitrary_types_allowed = True
        # Add JSON encoder for datetime fields
        json_encoders = {datetime: lambda dt: dt.isoformat() if dt else None}
        # Add validation mode that's more flexible
        validate_assignment = True
        extra = "ignore"  # Ignore extra fields when loading from DB


class UserRequest(BaseModel):
    username: str
    email: str
    password: str  # plain text from user input


class UserResponse(BaseModel):
    username: str
    email: str
    role: str = "user"
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
