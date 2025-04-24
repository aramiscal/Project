from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from api.auth.jwt_auth import TokenData, decode_jwt_token
from api.models.list import Item, ListRequest

max_id: int = 0

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/sign-in")

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> TokenData:
    token_data = decode_jwt_token(token)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token_data

list_router = APIRouter()

full_list = []

@list_router.get("")
async def get_items() -> list[Item]:
    return await Item.find_all().to_list()

@list_router.post("", status_code=status.HTTP_201_CREATED)
async def add_item(list: ListRequest) -> Item:
    newItem = Item(name=list.name, type=list.type, quantity=list.quantity, price=list.price)
    await Item.insert_one(newItem)
    return newItem

@list_router.delete("/{name}")
async def delete_item_by_name(name: str) -> dict:
    item = await Item.find_one(Item.name == name) 
    if item:
        await item.delete()
        return {"msg": f"The item with Name = {name} is removed"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Item with Name={name} is not found"
        )