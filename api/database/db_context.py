import asyncio
import os
import certifi
import ssl
from beanie import init_beanie
from api.models.my_config import get_settings
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure

from api.models.list import Item
from api.models.user import User

# Fix SSL certificate verification
os.environ["SSL_CERT_FILE"] = certifi.where()

# Set MongoDB client options with correct parameters for Atlas connection
client_options = {
    "serverSelectionTimeoutMS": 5000,  # 5 second timeout
    "connectTimeoutMS": 10000,  # 10 second timeout
    "retryWrites": True,
    "retryReads": True,
    "tlsAllowInvalidCertificates": True,  # Bypass certificate verification for development
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
        print("Initializing Beanie with document models...")
        await init_beanie(
            database=db,
            document_models=[User, Item],
            allow_index_dropping=True,  # Recreate indexes if needed
        )

        try:
            # List all collections for debugging
            collections = await db.list_collection_names()
            print(f"Available collections: {collections}")
        except Exception as e:
            print(f"Error listing collections: {str(e)}")

        print("Database initialization completed successfully")
        return client, db
    except Exception as e:
        print(f"Database initialization failed: {str(e)}")
        # Re-raise to let the application know initialization failed
        raise
