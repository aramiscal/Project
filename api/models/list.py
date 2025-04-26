from pydantic import BaseModel
from beanie import Document
from typing import Optional


class Item(Document):
    name: str
    type: str
    quantity: int
    price: float
    user_id: str  # Add user_id field to associate items with users

    class Settings:
        name = "products"


class ListRequest(BaseModel):
    name: str
    type: str
    quantity: int
    price: float
