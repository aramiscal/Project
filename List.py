from pydantic import BaseModel

class Item(BaseModel):
    name: str
    type: str
    quantity: int
    price: int

class ListRequest(BaseModel): 
    name: str
    type: str
    quantity: int
    price: int