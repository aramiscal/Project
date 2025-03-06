from pydantic import BaseModel

class List(BaseModel):
    id: int
    item: str
    quantity: int

class ListRequest(BaseModel): 
    item: str
    quantity: int