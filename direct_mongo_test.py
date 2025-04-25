# direct_mongo_test.py - Test direct MongoDB operations
import asyncio
import logging
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import certifi

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("direct_mongo_test")


async def test_direct_mongodb():
    try:
        # Import needed config
        from api.models.my_config import get_settings

        # Get configuration
        my_config = get_settings()
        connection_string = my_config.connection_string
        logger.info(f"Connection string: {connection_string}")

        # Connect directly to MongoDB
        client = AsyncIOMotorClient(
            connection_string,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000,
            tlsAllowInvalidCertificates=True,
            tlsCAFile=certifi.where(),
        )

        # Test ping
        await client.admin.command("ping")
        logger.info("MongoDB connection successful")

        # Get database
        db = client["list_app"]
        logger.info(f"Using database: list_app")

        # Get collections
        collections = await db.list_collection_names()
        logger.info(f"Collections in database: {collections}")

        # Access users collection
        users_collection = db["users"]

        # Create a test user document
        test_username = f"direct_test_user_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        test_user = {
            "username": test_username,
            "email": f"{test_username}@example.com",
            "password": "hashed_password_direct_test",
            "role": "user",
            "created_at": datetime.utcnow(),
        }

        # Insert the test user
        logger.info(f"Inserting test user: {test_username}")
        result = await users_collection.insert_one(test_user)

        if result.inserted_id:
            logger.info(f"User inserted successfully with ID: {result.inserted_id}")

            # Retrieve the user
            retrieved_user = await users_collection.find_one(
                {"username": test_username}
            )
            if retrieved_user:
                logger.info(f"Retrieved user: {retrieved_user}")

                # Count users in collection
                user_count = await users_collection.count_documents({})
                logger.info(f"Total users in collection: {user_count}")

                # List all users
                all_users = await users_collection.find({}).to_list(length=100)
                logger.info(f"All users in database ({len(all_users)}):")
                for user in all_users:
                    logger.info(f"- {user.get('username')} (ID: {user.get('_id')})")

                # Clean up
                delete_result = await users_collection.delete_one(
                    {"username": test_username}
                )
                if delete_result.deleted_count > 0:
                    logger.info(f"Test user deleted successfully")
                else:
                    logger.warning(f"Failed to delete test user")
            else:
                logger.error(f"Failed to retrieve test user after insertion")
        else:
            logger.error(f"Failed to insert test user")

        # Close connection
        client.close()
        logger.info("MongoDB connection closed")

    except Exception as e:
        logger.error(f"Test failed: {str(e)}", exc_info=True)


if __name__ == "__main__":
    logger.info("Starting direct MongoDB test")
    asyncio.run(test_direct_mongodb())
    logger.info("Test completed")
