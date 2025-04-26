from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext

from api.auth.jwt_auth import Token, TokenData, create_access_token, decode_jwt_token
from api.models.user import User, UserRequest, UserResponse

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class HashPassword:
    def create_hash(self, password: str):
        return pwd_context.hash(password)

    def verify_hash(self, input_password: str, hashed_password: str):
        return pwd_context.verify(input_password, hashed_password)


# OAuth setup
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
hash_password = HashPassword()


def get_user(token: Annotated[str, Depends(oauth2_scheme)]) -> TokenData:
    return decode_jwt_token(token)


user_router = APIRouter()


@user_router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=dict)
async def sign_up(user: UserRequest, response: Response):
    """Create a new user account"""
    try:
        # Get database access
        db = User.get_motor_collection().database
        users_collection = db["users"]

        # Check if username already exists
        existing_user = await users_collection.find_one({"username": user.username})
        if existing_user:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"detail": "User already exists"}

        # Check if email already exists
        existing_email = await users_collection.find_one({"email": user.email})
        if existing_email:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"detail": "Email already in use"}

        # Hash the password
        hashed_pwd = hash_password.create_hash(user.password)

        # Create user document
        new_user_doc = {
            "username": user.username,
            "email": user.email,
            "password": hashed_pwd,
            "role": "user",
            "created_at": datetime.utcnow(),
            "last_login": None,
        }

        # Insert into MongoDB
        result = await users_collection.insert_one(new_user_doc)

        if result and result.inserted_id:
            return {"message": "User created successfully"}
        else:
            response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            return {"detail": "Failed to create user: Insert operation returned no ID"}

    except Exception as e:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {"detail": f"Failed to create user: {str(e)}"}


@user_router.post("/sign-in", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], response: Response
) -> Token:
    """Authenticate user and return JWT token"""
    try:
        # Get database access
        db = User.get_motor_collection().database
        users_collection = db["users"]

        # Find the user
        username = form_data.username
        existing_user_doc = await users_collection.find_one({"username": username})

        if not existing_user_doc:
            response.status_code = status.HTTP_401_UNAUTHORIZED
            return {
                "access_token": "",
                "token_type": "bearer",
                "detail": "Username or Password is invalid.",
            }

        # Verify password
        authenticated = hash_password.verify_hash(
            form_data.password, existing_user_doc["password"]
        )

        if authenticated:
            # Update last login time
            current_time = datetime.utcnow()
            await users_collection.update_one(
                {"_id": existing_user_doc["_id"]},
                {"$set": {"last_login": current_time}},
            )

            # Create access token
            role = existing_user_doc.get("role", "user")
            access_token = create_access_token({"username": username, "role": role})
            return Token(access_token=access_token)
        else:
            response.status_code = status.HTTP_401_UNAUTHORIZED
            return {
                "access_token": "",
                "token_type": "bearer",
                "detail": "Invalid username or password",
            }

    except Exception as e:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {
            "access_token": "",
            "token_type": "bearer",
            "detail": f"Sign-in error: {str(e)}",
        }


@user_router.get("/me", response_model=UserResponse)
async def get_current_user(token_data: Annotated[TokenData, Depends(get_user)]):
    """Get the current user's profile information"""
    try:
        # Use direct MongoDB access
        db = User.get_motor_collection().database
        users_collection = db["users"]
        user_doc = await users_collection.find_one({"username": token_data.username})

        if not user_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # Convert to UserResponse model
        return UserResponse(
            username=user_doc["username"],
            email=user_doc["email"],
            role=user_doc.get("role", "user"),
            created_at=user_doc.get("created_at"),
            last_login=user_doc.get("last_login"),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user profile: {str(e)}",
        )
