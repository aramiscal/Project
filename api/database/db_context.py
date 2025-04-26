import asyncio
import os
import certifi
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
    "serverSelectionTimeoutMS": 10000,  # 10 second timeout
    "connectTimeoutMS": 20000,  # 20 second timeout
    "retryWrites": True,
    "retryReads": True,
    "tlsAllowInvalidCertificates": True,  # Only for development environment
}


async def init_database():
    """Initialize database connection and set up collections"""
    try:
        # Get configuration
        my_config = get_settings()
        connection_string = my_config.connection_string

        # Create motor client
        client = AsyncIOMotorClient(connection_string, **client_options)

        try:
            # Verify connection is working with timeout
            await asyncio.wait_for(client.admin.command("ping"), timeout=10.0)
        except (
            asyncio.TimeoutError,
            ServerSelectionTimeoutError,
            ConnectionFailure,
        ) as e:
            print(f"MongoDB connection failed: {str(e)}")
            print("Please check if:")
            print("1. Your MongoDB server is running (if using local MongoDB)")
            print("2. Your connection string in .env is correct")
            print("3. Your network can connect to MongoDB Atlas (if using cloud)")
            print("4. The username and password in the connection string are correct")
            raise

        # Extract database name from connection string or use default
        try:
            parsed_db_name = connection_string.split("/")[-1]
            db_name = parsed_db_name if parsed_db_name else "list_app"
        except Exception:
            db_name = "list_app"  # Default fallback

        db = client[db_name]

        # Initialize Beanie with the document models
        await init_beanie(
            database=db,
            document_models=[User, Item],
            allow_index_dropping=True,  # Recreate indexes if needed
        )

        return client, db
    except Exception as e:
        print(f"Database initialization failed: {str(e)}")
        # Re-raise to let the application know initialization failed
        raise
