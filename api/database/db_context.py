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


# Modified init_database function for api/database/db_context.py
async def init_database():
    """Initialize database connection and set up collections"""
    try:
        # Get configuration
        my_config = get_settings()
        connection_string = my_config.connection_string

        # Print connection string (remove in production)
        print(
            f"Attempting to connect to MongoDB with connection string: {connection_string}"
        )

        # Create motor client with updated connection options
        client_options = {
            "serverSelectionTimeoutMS": 10000,  # Increase timeout to 10 seconds
            "connectTimeoutMS": 20000,  # Increase timeout to 20 seconds
            "retryWrites": True,
            "retryReads": True,
            "tlsAllowInvalidCertificates": True,  # For development only
        }

        # Create client
        client = AsyncIOMotorClient(connection_string, **client_options)

        try:
            # Verify connection is working with increased timeout
            print("Testing MongoDB connection...")
            await asyncio.wait_for(client.admin.command("ping"), timeout=10.0)
            print("MongoDB connection successful!")
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
        # Connection string format: mongodb+srv://username:password@cluster0.rwhzu.mongodb.net/list_app
        try:
            parsed_db_name = connection_string.split("/")[-1]
            db_name = parsed_db_name if parsed_db_name else "list_app"
            print(f"Using database: {db_name}")
        except Exception as e:
            print(f"Error parsing database name: {str(e)}")
            db_name = "list_app"  # Default fallback
            print(f"Using default database: {db_name}")

        db = client[db_name]

        # Ensure collections exist before initializing Beanie
        print("Checking for existing collections...")
        collection_names = await db.list_collection_names()
        print(
            f"Found collections: {', '.join(collection_names) if collection_names else 'None'}"
        )

        if "users" not in collection_names:
            print("Creating 'users' collection...")
            await db.create_collection("users")

        if "products" not in collection_names:
            print("Creating 'products' collection...")
            await db.create_collection("products")

        # Initialize Beanie with the document models
        print("Initializing Beanie ODM...")
        await init_beanie(
            database=db,
            document_models=[User, Item],
            allow_index_dropping=True,  # Recreate indexes if needed
        )
        print("Beanie initialization complete!")

        return client, db
    except Exception as e:
        print(f"Database initialization failed: {str(e)}")
        # Re-raise to let the application know initialization failed
        raise
