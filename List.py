from pydantic import BaseModel

class Item(BaseModel):
    name: str
    type: str
    quantity: int
    price: float

class ListRequest(BaseModel): 
    name: str
    type: str
    quantity: int
    price: float