from beanie import init_beanie
from api.models.my_config import get_settings
from motor.motor_asyncio import AsyncIOMotorClient

from api.models.list import Item
from api.models.user import User

import certifi
import os
import logging

os.environ["SSL_CERT_FILE"] = certifi.where()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def init_database():
    my_config = get_settings()
    client = AsyncIOMotorClient(my_config.connection_string)
    await client.server_info()
    db = client["list_app"]
    await init_beanie(database=db, document_models=[User, Item])

    collections = await db.list_collection_names()
    logger.info(f"Available collections: {collections}")

    if "users" not in collections:
        logger.info("Users collection not found")

        logger.info(f"User model settimgs: {User.Settings.name}")
