from fastapi import APIRouter, HTTPException, status

from list import Item, ListRequest

max_id: int = 0

list_router = APIRouter()

full_list = []

@list_router.get("")
async def get_items() -> list[Item]:
    return full_list

@list_router.post("", status_code=status.HTTP_201_CREATED)
async def add_item(list: ListRequest) -> Item:
    newItem = Item(name=list.name, type=list.type, quantity=list.quantity, price=list.price)
    full_list.append(newItem)
    return newItem

@list_router.delete("/{name}")
async def delete_item_by_name(name: str) -> dict:
    for i in range(len(full_list)):
        if full_list[i].name == name:
            full_list.pop(i)
            return {"msg": f"The item with Name = {name} is removed"}
        
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND, detail=f"Item with Name={name} is not found"
    )