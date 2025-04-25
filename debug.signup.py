"""
Enhanced MongoDB User Registration Debugger (Fixed)

This script tests the actual user registration process by directly calling the
database functions that would be executed during signup.

Save as debug_signup.py and run with: python debug_signup.py
"""

import asyncio
import os
import sys
import traceback
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime
from passlib.context import CryptContext

# Fix SSL certificate verification
os.environ["SSL_CERT_FILE"] = certifi.where()

# Load environment variables
load_dotenv("api/.env")
connection_string = os.getenv("connection_string")

# Password hashing setup (same as in your app)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password):
    return pwd_context.hash(password)


# Set MongoDB client options
client_options = {
    "serverSelectionTimeoutMS": 5000,
    "connectTimeoutMS": 10000,
    "retryWrites": True,
    "retryReads": True,
    "tlsAllowInvalidCertificates": True,
}


async def main():
    print("Enhanced MongoDB User Registration Debugger")
    print("==========================================")
    print(f"Connection string: {connection_string}")

    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(connection_string, **client_options)

        # Test connection
        await client.admin.command("ping")
        print("✅ MongoDB connection successful")

        # Extract database name from connection string
        db_name = connection_string.split("/")[-1]
        db = client[db_name]
        print(f"Using database: {db_name}")

        # Check if users collection exists
        collections = await db.list_collection_names()
        print(f"Available collections: {collections}")

        if "users" not in collections:
            print("⚠️ 'users' collection doesn't exist. Creating it now...")
            await db.create_collection("users")
            print("✅ 'users' collection created")

        # Get the users collection
        users_collection = db["users"]

        # Generate test user data
        test_username = f"testuser_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        test_email = f"{test_username}@example.com"
        test_password = "Password123!"
        hashed_pwd = hash_password(test_password)

        print(f"\nAttempting to insert test user: {test_username}")
        print(f"Email: {test_email}")
        print(f"Password hash generated successfully: {bool(hashed_pwd)}")

        # Create user document
        new_user = {
            "username": test_username,
            "email": test_email,
            "password": hashed_pwd,
            "role": "user",
            "created_at": datetime.utcnow(),
            "last_login": None,
        }

        print("\nUser document created. Attempting direct MongoDB insertion...")

        # METHOD 1: Try direct insertion
        try:
            result = await users_collection.insert_one(new_user)
            if result.inserted_id:
                print(
                    f"✅ METHOD 1: Direct insertion successful! ID: {result.inserted_id}"
                )

                # Verify user was inserted
                found_user = await users_collection.find_one(
                    {"_id": result.inserted_id}
                )
                if found_user:
                    print(f"✅ User verification successful")
                else:
                    print(f"❌ Could not verify user after insertion")
            else:
                print("❌ METHOD 1: Insert operation returned no ID")
        except Exception as e:
            print(f"❌ METHOD 1: Direct insertion failed with error: {str(e)}")
            traceback.print_exc()

        # Check user count after insertion attempts
        user_count = await users_collection.count_documents({})
        print(f"\nCurrent user count in database: {user_count}")

        # List some users for verification
        print("\nListing up to 5 users in the database:")
        async for user in users_collection.find().limit(5):
            user_info = {k: v for k, v in user.items() if k != "password"}
            print(f"- {user_info}")

    except Exception as e:
        print(f"❌ Error during debugging: {str(e)}")
        traceback.print_exc()
    finally:
        if "client" in locals():
            client.close()
        print("\nDebug script completed")


if __name__ == "__main__":
    asyncio.run(main())
