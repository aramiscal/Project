from beanie import Document
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

print("USER MODEL LOADED")  # This confirms the model is loaded


class User(Document):
    username: str
    email: str
    password: str  # hashed & salted password in the database
    role: str = "user"
    created_at: datetime = None
    last_login: datetime = None

    class Settings:
        name = "users"  # collection name in MongoDB

    class Config:
        arbitrary_types_allowed = True


print(
    f"User model settings: collection name = {User.Settings.name}"
)  # Verify collection name


class UserRequest(BaseModel):
    username: str
    email: str
    password: str  # plain text from user input


class UserResponse(BaseModel):
    username: str
    email: str
    role: str = "user"
    created_at: datetime = None
    last_login: datetime = None
