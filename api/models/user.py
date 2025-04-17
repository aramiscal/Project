from beanie import Document


class User(Document):
    username: str
    email: str
    password: str

    class Settings:
        name = "users"  # by default, if not having this settings, then the collection name is "Product"