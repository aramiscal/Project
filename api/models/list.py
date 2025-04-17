from pydantic import BaseModel
from beanie import Document

class Item(Document):
    name: str
    type: str
    quantity: int
    price: float

    class Settings:
        name = "products"

class ListRequest(BaseModel): 
    name: str
    type: str
    quantity: int
    price: float