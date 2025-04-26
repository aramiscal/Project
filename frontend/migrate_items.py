"""
Migration script to update existing items with user_id field.
Run this script once after updating the Item model to ensure existing data
is migrated to the new schema.
"""

import asyncio
import sys
import os

# Add the parent directory to the path so we can import the API modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.database.db_context import init_database
from api.models.list import Item
from api.models.user import User


async def migrate_items():
    """Migrate existing items to associate them with the first user in the database."""
    print("Starting migration of existing items...")

    # Initialize database connection
    try:
        await init_database()
        print("Database connection successful")
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return

    # Find all items that don't have a user_id
    items_without_user = await Item.find({"user_id": {"$exists": False}}).to_list()

    if not items_without_user:
        print("No items found without user_id. Migration not needed.")
        return

    print(f"Found {len(items_without_user)} items without user_id")

    # Get the first user from the database
    first_user = await User.find_one({})

    if not first_user:
        print("No users found in the database. Cannot migrate items.")
        return

    print(f"Using user '{first_user.username}' as the owner for existing items")

    # Update all items to associate them with the first user
    update_count = 0
    for item in items_without_user:
        item.user_id = first_user.username
        await item.save()
        update_count += 1

    print(
        f"Successfully updated {update_count} items with user_id = {first_user.username}"
    )
    print("Migration completed successfully")


# Run the migration
if __name__ == "__main__":
    asyncio.run(migrate_items())
