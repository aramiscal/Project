from beanie import init_beanie
from api.models.my_config import get_settings
from motor.motor_asyncio import AsyncIOMotorClient

from api.models.list import Item
from api.models.user import User

import certifi
import os

os.environ["SSL_CERT_FILE"] = certifi.where()


async def init_database():
    my_config = get_settings()
    client = AsyncIOMotorClient(my_config.connection_string)
    db = client["list_app"]
    await init_beanie(database=db, document_models=[User, Item])
