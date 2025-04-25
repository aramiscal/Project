# debug_db.py - Place this file in your project root
import asyncio
import logging
import os
import ssl
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from api.models.my_config import get_settings
from api.models.user import User
from api.models.list import Item

# Fix SSL certificate verification by setting environment variable
os.environ["SSL_CERT_FILE"] = certifi.where()

# Configure verbose logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # Log to console
        logging.FileHandler("debug.log")  # Log to file
    ]
)

logger = logging.getLogger("db_debug")

async def test_db_connection():
    try:
        logger.info("Starting database connection test")
        
        # Get configuration
        my_config = get_settings()
        connection_string = my_config.connection_string
        logger.info(f"Connection string: {connection_string}")
        
        # Create MongoDB client with TLS options
        logger.info("Creating MongoDB client with SSL fix")
        client = AsyncIOMotorClient(
            connection_string,
            serverSelectionTimeoutMS=5000, 
            connectTimeoutMS=10000,
            tlsAllowInvalidCertificates=True  # This is the key parameter to fix SSL issues
        )
        
        # Test basic connection
        logger.info("Testing basic connection with ping")
        await client.admin.command("ping")
        logger.info("Ping successful - connection works!")
        
        # Check database
        db_name = "list_app"
        db = client[db_name]
        logger.info(f"Using database: {db_name}")
        
        # List all collections
        logger.info("Listing all collections:")
        collections = await db.list_collection_names()
        logger.info(f"Collections in database: {collections}")
        
        # Initialize Beanie
        logger.info("Initializing Beanie with document models")
        await init_beanie(
            database=db,
            document_models=[User, Item],
        )
        logger.info("Beanie initialization successful")
        
        # Test insert User
        logger.info("Testing User insert")
        test_user = User(
            username="test_debug_user",
            email="testdebug@example.com",
            password="hashed_password_here",
            role="user"
        )
        logger.info(f"User model initialized: {test_user}")
        
        try:
            logger.info("Attempting to insert test user...")
            result = await test_user.insert()
            logger.info(f"Insert result: {result}")
            logger.info("User insert successful")
            
            # Verify the user was inserted
            found_user = await User.find_one(User.username == "test_debug_user")
            if found_user:
                logger.info(f"Successfully retrieved test user: {found_user}")
            else:
                logger.error("Failed to retrieve test user after insert!")
                
            # Clean up test user
            await test_user.delete()
            logger.info("Test user deleted")
        except Exception as e:
            logger.error(f"Error during user insert test: {str(e)}", exc_info=True)
        
        # Test insert Item
        logger.info("Testing Item insert")
        test_item = Item(
            name="Test Item",
            type="Test Type",
            quantity=1,
            price=9.99
        )
        logger.info(f"Item model initialized: {test_item}")
        
        try:
            logger.info("Attempting to insert test item...")
            result = await test_item.insert()
            logger.info(f"Insert result: {result}")
            logger.info("Item insert successful")
            
            # Verify the item was inserted
            found_item = await Item.find_one(Item.name == "Test Item")
            if found_item:
                logger.info(f"Successfully retrieved test item: {found_item}")
            else:
                logger.error("Failed to retrieve test item after insert!")
                
            # Clean up test item
            await test_item.delete()
            logger.info("Test item deleted")
        except Exception as e:
            logger.error(f"Error during item insert test: {str(e)}", exc_info=True)
        
        logger.info("Database tests completed")
        
    except Exception as e:
        logger.error(f"Database test failed: {str(e)}", exc_info=True)

# Run the test
if __name__ == "__main__":
    logger.info("Starting database debug script")
    asyncio.run(test_db_connection())
    logger.info("Database debug script completed")