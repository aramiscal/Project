import asyncio
from beanie import init_beanie
from api.models.my_config import get_settings
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure

from api.models.list import Item
from api.models.user import User

import certifi
import os
import logging

os.environ["SSL_CERT_FILE"] = certifi.where()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set MongoDB client options
client_options = {
    "serverSelectionTimeoutMS": 5000,  # 5 second timeout
    "connectTimeoutMS": 10000,  # 10 second timeout
    "retryWrites": True,
    "retryReads": True,
    "w": "majority",  # Write concern
    "tlsCAFile": certifi.where(),  # TLS/SSL certificate
}


async def init_database():
    """Initialize database connection and set up collections"""
    try:
        # Get configuration
        my_config = get_settings()
        connection_string = my_config.connection_string

        # Log connection attempt (hide most of the connection string for security)
        visible_part = connection_string.split("@")[0].split(":")
        if len(visible_part) > 1:
            # Hide the password part of the connection string
            masked_conn = f"{visible_part[0]}:***@" + connection_string.split("@")[1]
            logger.info(f"Connecting to MongoDB: {masked_conn}")
        else:
            logger.info("Connecting to MongoDB (connection string masked)")

        # Create motor client with connection options
        client = AsyncIOMotorClient(connection_string, **client_options)

        # Test connection with timeout
        try:
            # Verify connection is working
            await asyncio.wait_for(client.admin.command("ping"), timeout=5.0)
            logger.info("Successfully connected to MongoDB server")
        except (
            asyncio.TimeoutError,
            ServerSelectionTimeoutError,
            ConnectionFailure,
        ) as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            logger.error("Please check your connection string and network connectivity")
            raise

        # Get or create database
        db_name = "list_app"  # Explicitly set database name
        db = client[db_name]
        logger.info(f"Using database: {db_name}")

        # Initialize Beanie with the document models
        await init_beanie(
            database=db,
            document_models=[User, Item],
            allow_index_dropping=True,  # Recreate indexes if needed
        )
        logger.info("Beanie initialization complete")

        # Check if collections exist
        collections = await db.list_collection_names()
        logger.info(f"Available collections: {collections}")

        # Report on model settings and collection names
        logger.info(f"User model settings - collection name: {User.Settings.name}")
        logger.info(f"Item model settings - collection name: {Item.Settings.name}")

        # Count existing documents
        user_count = await User.count()
        item_count = await Item.count()
        logger.info(f"Found {user_count} users and {item_count} items in the database")

        return client, db
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        # Re-raise to let the application know initialization failed
        raise
