"""
MongoDB Write Permission Test Script

This script tests if your MongoDB user has write permissions
by attempting to insert a test document.

Save as test_mongo_write.py and run with: python test_mongo_write.py
"""

import asyncio
import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime  # Use standard datetime, not asyncio.datetime

# Fix SSL certificate verification
os.environ["SSL_CERT_FILE"] = certifi.where()

# Set MongoDB client options
client_options = {
    "serverSelectionTimeoutMS": 5000,
    "connectTimeoutMS": 10000,
    "retryWrites": True,
    "retryReads": True,
    "tlsAllowInvalidCertificates": True,
}


async def test_mongodb_write():
    # Use your connection string (copied from .env file)
    connection_string = (
        "mongodb+srv://aramiscal:mBGgT21p3l1qzKVH@cluster0.rwhzu.mongodb.net/list_app"
    )

    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(connection_string, **client_options)

        # Test connection
        await client.admin.command("ping")
        print("✅ MongoDB connection successful")

        # Access the database
        db = client["list_app"]

        # Try to write to a test collection
        test_collection = db["test_permissions"]

        # Insert a test document
        result = await test_collection.insert_one(
            {
                "test": "permissions_check",
                "timestamp": datetime.now(),  # Use standard datetime
            }
        )

        if result.inserted_id:
            print(f"✅ Successfully inserted document: {result.inserted_id}")
            print("Your MongoDB user has write permissions!")

            # Clean up the test document
            await test_collection.delete_one({"_id": result.inserted_id})
            print("✅ Successfully cleaned up test document")
        else:
            print("❌ Failed to insert document (no ID returned)")

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        if "not authorized" in str(e).lower():
            print(
                "\nPermission error detected. Please check your MongoDB Atlas user permissions:"
            )
            print("1. Log in to MongoDB Atlas")
            print("2. Go to Database Access")
            print(
                "3. Ensure your user 'aramiscal' has the 'readWrite' role for 'list_app' database"
            )
    finally:
        if "client" in locals():
            client.close()


if __name__ == "__main__":
    asyncio.run(test_mongodb_write())
