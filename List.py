from pydantic import BaseModel

class Item(BaseModel):
    id: int
    name: str
    quantity: int

class ListRequest(BaseModel): 
    name: str
    quantity: int