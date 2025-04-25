import asyncio
from beanie import init_beanie
from api.models.my_config import get_settings
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure

from api.models.list import Item
from api.models.user import User

import certifi
import os
import ssl

# Set MongoDB client options with modified SSL context
client_options = {
    "serverSelectionTimeoutMS": 5000,  # 5 second timeout
    "connectTimeoutMS": 10000,  # 10 second timeout
    "retryWrites": True,
    "retryReads": True,
    "w": "majority",  # Write concern
    "tlsCAFile": certifi.where(),  # TLS/SSL certificate
    "ssl": True,
    "ssl_cert_reqs": ssl.CERT_NONE,  # Don't verify certificate (use in development only)
}


async def init_database():
    """Initialize database connection and set up collections"""
    try:
        # Get configuration
        my_config = get_settings()
        connection_string = my_config.connection_string
        print(f"Connecting to MongoDB with connection string: {connection_string}")

        # Create motor client with connection options
        client = AsyncIOMotorClient(connection_string, **client_options)

        # Test connection with timeout
        try:
            # Verify connection is working
            await asyncio.wait_for(client.admin.command("ping"), timeout=5.0)
            print("Successfully connected to MongoDB!")
        except (
            asyncio.TimeoutError,
            ServerSelectionTimeoutError,
            ConnectionFailure,
        ) as e:
            print(f"Failed to connect to MongoDB: {str(e)}")
            raise

        # Get or create database
        db_name = "list_app"  # Explicitly set database name
        db = client[db_name]

        # Initialize Beanie with the document models
        await init_beanie(
            database=db,
            document_models=[User, Item],
            allow_index_dropping=True,  # Recreate indexes if needed
        )

        # List all collections for debugging
        collections = await db.list_collection_names()
        print(f"Available collections: {collections}")

        print("Database initialization completed successfully")
        return client, db
    except Exception as e:
        print(f"Database initialization failed: {str(e)}")
        # Re-raise to let the application know initialization failed
        raise
