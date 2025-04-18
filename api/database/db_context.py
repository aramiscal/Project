from beanie import init_beanie
from models.my_config import get_setting
from motor.motor_asyncio import AsyncIOMotorClient

from models.list import Item
from models.user import User

import certifi
import os
os.environ['SSL_CERT_FILE'] = certifi.where()

async def init_database():
    my_config = get_setting()
    client = AsyncIOMotorClient(my_config.connection_string)
    db = client["list_app"]
    await init_beanie(database=db, document_models=[User, Item])