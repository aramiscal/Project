from beanie import Document
from pydantic import BaseModel


class User(Document):
    username: str
    email: str
    password: str # ash $ salted password in the database

    class Settings:
        name = "users"  # by default, if not having this settings, then the collection name is "Product"

class UserRequest(BaseModel):
    username: str
    email: str
    password: str # plain text from user input