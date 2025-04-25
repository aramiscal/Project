# debug_signup.py - Debug the signup process
import asyncio
import logging
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
import json
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("signup_debug.log")],
)
logger = logging.getLogger("signup_debug")


# Add trace for all steps
def trace(msg):
    logger.info(f"TRACE: {msg}")


async def debug_signup_process():
    try:
        # Import dependencies as needed
        trace("Importing dependencies")
        from api.models.my_config import get_settings
        from api.models.user import User
        from api.database.db_context import init_database
        from passlib.context import CryptContext

        # Configure password hashing
        trace("Configuring password context")
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        # Create test data
        trace("Creating test data")
        test_username = f"signup_test_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        test_email = f"{test_username}@example.com"
        test_password = "test_password"
        hashed_password = pwd_context.hash(test_password)

        # Initialize database
        trace("Initializing database connection")
        client, db = await init_database()
        trace("Database connection initialized")

        # Create user model instance
        trace("Creating User model instance")
        try:
            new_user = User(
                username=test_username,
                email=test_email,
                password=hashed_password,
                role="user",
                created_at=datetime.utcnow(),
            )
            trace(f"User model created: {new_user}")
        except Exception as e:
            trace(f"Error creating User model: {str(e)}")
            raise

        # Attempt to save user
        trace("Attempting to save user")
        try:
            result = await new_user.save()
            trace(f"Save result: {result}")
        except Exception as e:
            trace(f"Error saving user: {str(e)}")
            raise

        # Verify user exists
        trace("Verifying user exists")
        try:
            # Try model-based query
            found_user = await User.find_one(User.username == test_username)
            if found_user:
                trace(f"User found with model query: {found_user}")
            else:
                trace("User not found with model query")

            # Try direct MongoDB query
            users_collection = db["users"]
            doc = await users_collection.find_one({"username": test_username})
            if doc:
                trace(f"User found with direct query: {doc}")
            else:
                trace("User not found with direct query")
        except Exception as e:
            trace(f"Error verifying user: {str(e)}")

        # List all users
        trace("Listing all users")
        try:
            users_collection = db["users"]
            all_users = await users_collection.find({}).to_list(length=100)
            trace(f"Found {len(all_users)} users in collection")
            for i, user in enumerate(all_users):
                trace(f"User {i+1}: {user.get('username')} (ID: {user.get('_id')})")
        except Exception as e:
            trace(f"Error listing users: {str(e)}")

        # Clean up
        trace("Cleaning up")
        try:
            if "found_user" in locals() and found_user:
                await found_user.delete()
                trace("User deleted through model")
            else:
                users_collection = db["users"]
                await users_collection.delete_one({"username": test_username})
                trace("User deleted directly")
        except Exception as e:
            trace(f"Error during cleanup: {str(e)}")

    except Exception as e:
        trace(f"Debug process failed: {str(e)}")
        logger.error("Exception details:", exc_info=True)


if __name__ == "__main__":
    logger.info("Starting signup debug process")
    asyncio.run(debug_signup_process())
    logger.info("Debug process completed")
