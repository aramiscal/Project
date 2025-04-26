from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from api.auth.jwt_auth import TokenData, decode_jwt_token
from api.models.list import Item, ListRequest

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


@list_router.get("")
async def get_items(
    current_user: Annotated[TokenData, Depends(get_current_user)],
) -> List[Item]:
    """Get items for the current user only"""
    # Filter items by the current user's username
    return await Item.find(Item.user_id == current_user.username).to_list()


@list_router.post("", status_code=status.HTTP_201_CREATED)
async def add_item(
    list_item: ListRequest,
    current_user: Annotated[TokenData, Depends(get_current_user)],
) -> Item:
    """Add an item for the current user"""
    newItem = Item(
        name=list_item.name,
        type=list_item.type,
        quantity=list_item.quantity,
        price=list_item.price,
        user_id=current_user.username,  # Associate the item with the current user
    )
    await Item.insert_one(newItem)
    return newItem


@list_router.delete("/{name}")
async def delete_item_by_name(
    name: str, current_user: Annotated[TokenData, Depends(get_current_user)]
) -> dict:
    """Delete an item only if it belongs to the current user"""
    # Find the item with the specified name that belongs to the current user
    item = await Item.find_one(
        {"$and": [{"name": name}, {"user_id": current_user.username}]}
    )

    if item:
        await item.delete()
        return {"msg": f"The item with Name = {name} is removed"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with Name={name} is not found or does not belong to you",
        )
