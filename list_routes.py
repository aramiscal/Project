from typing import Annotated
from fastapi import APIRouter, HTTPException, Path, status

from list import Item, ListRequest

max_id: int = 0

list_router = APIRouter()

full_list = []

@list_router.get("")
async def get_items() -> list[Item]:
    return full_list

@list_router.post("", status_code=status.HTTP_201_CREATED)
async def add_item(list: ListRequest) -> Item:
    global max_id
    max_id += 1 
    newItem = Item(id=max_id, name=list.name, quantity=list.quantity)
    full_list.append(newItem)
    return newItem

@list_router.get("/{id}")
async def get_item_by_id(id: Annotated[int, Path(ge=0)]) -> Item:
    for list in full_list:
        if list.id == id:
            return list
        
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND, detail=f"Item with ID = {id} is not found"
    )

@list_router.delete("/{id}")
async def delete_item_by_id(id: Annotated[int, Path(ge=0)]) -> dict:
    for i in range(len(full_list)):
        list = full_list[i]
        if list.id == id:
            full_list.pop(i)
            return {"msg": f"The item with ID = {id} is removed"}
        
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND, detail=f"Item with ID={id} is not found"
    )