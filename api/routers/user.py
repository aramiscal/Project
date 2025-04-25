from datetime import datetime
from typing import Annotated
from beanie import WriteRules
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from pydantic import ValidationError
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("user_routes.log")],
)
logger = logging.getLogger("user_routes")

from api.auth.jwt_auth import Token, TokenData, create_access_token, decode_jwt_token
from api.models.user import User, UserRequest, UserResponse

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class HashPassword:
    def create_hash(self, password: str):
        return pwd_context.hash(password)

    def verify_hash(self, input_password: str, hashed_password: str):
        return pwd_context.verify(input_password, hashed_password)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
hash_password = HashPassword()


def get_user(token: Annotated[str, Depends(oauth2_scheme)]) -> TokenData:
    return decode_jwt_token(token)


user_router = APIRouter()


@user_router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=dict)
async def sign_up(user: UserRequest, response: Response):
    try:
        logger.info(
            f"Signup attempt for username: {user.username}, email: {user.email}"
        )

        # Get direct access to database
        db = User.get_motor_collection().database
        users_collection = db["users"]

        # Check if username already exists using direct query
        existing_user = await users_collection.find_one({"username": user.username})
        if existing_user:
            logger.warning(f"Username already exists: {user.username}")
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"detail": "User already exists"}

        # Check if email already exists using direct query
        existing_email = await users_collection.find_one({"email": user.email})
        if existing_email:
            logger.warning(f"Email already in use: {user.email}")
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"detail": "Email already in use"}

        # Hash the password
        hashed_pwd = hash_password.create_hash(user.password)
        logger.info("Password hashed successfully")

        # Create user document directly
        current_time = datetime.utcnow()
        new_user_doc = {
            "username": user.username,
            "email": user.email,
            "password": hashed_pwd,
            "role": "user",
            "created_at": current_time,
            "last_login": None,
        }

        logger.info(f"User document created: {new_user_doc}")

        try:
            # Insert directly into MongoDB
            logger.info(f"Attempting to insert user directly: {user.username}")
            result = await users_collection.insert_one(new_user_doc)

            if result.inserted_id:
                logger.info(f"User inserted successfully with ID: {result.inserted_id}")

                # Verify user exists
                verify_user = await users_collection.find_one(
                    {"_id": result.inserted_id}
                )
                if verify_user:
                    logger.info(
                        f"Verification successful - user found in database: {verify_user['_id']}"
                    )
                else:
                    logger.warning(
                        f"Verification failed - user not found in database after insert"
                    )

                return {"message": "User created successfully"}
            else:
                logger.error("Insert operation returned no ID")
                response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
                return {
                    "detail": "Failed to create user: Insert operation returned no ID"
                }

        except Exception as e:
            logger.error(
                f"Database error during user creation: {str(e)}", exc_info=True
            )
            response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            return {"detail": f"Database error: {str(e)}"}

    except Exception as e:
        logger.error(f"General error in sign_up: {str(e)}", exc_info=True)
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {"detail": f"Failed to create user: {str(e)}"}


@user_router.post("/sign-in", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], response: Response
) -> Token:
    try:
        logger.info(f"Sign-in attempt for username: {form_data.username}")

        # Get direct access to database
        db = User.get_motor_collection().database
        users_collection = db["users"]

        # Find the user in the database using direct query
        username = form_data.username
        existing_user_doc = await users_collection.find_one({"username": username})

        if not existing_user_doc:
            logger.warning(f"Sign-in failed: User not found: {username}")
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
            logger.info(f"User authenticated successfully: {username}")
            # Update last login time
            current_time = datetime.utcnow()
            await users_collection.update_one(
                {"_id": existing_user_doc["_id"]},
                {"$set": {"last_login": current_time}},
            )
            logger.info(f"Last login time updated for: {username}")

            # Create access token
            role = existing_user_doc.get("role", "user")
            access_token = create_access_token({"username": username, "role": role})
            logger.info(f"Access token created for: {username}")
            return Token(access_token=access_token)
        else:
            logger.warning(f"Password verification failed for: {username}")
            response.status_code = status.HTTP_401_UNAUTHORIZED
            return {
                "access_token": "",
                "token_type": "bearer",
                "detail": "Invalid username or password",
            }

    except Exception as e:
        logger.error(f"Sign-in error: {str(e)}", exc_info=True)
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {
            "access_token": "",
            "token_type": "bearer",
            "detail": f"Sign-in error: {str(e)}",
        }


@user_router.get("/me", response_model=UserResponse)
async def get_current_user(token_data: Annotated[TokenData, Depends(get_user)]):
    try:
        logger.info(f"Getting profile for user: {token_data.username}")

        # Use direct MongoDB access
        db = User.get_motor_collection().database
        users_collection = db["users"]
        user_doc = await users_collection.find_one({"username": token_data.username})

        if not user_doc:
            logger.warning(f"User not found: {token_data.username}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        logger.info(f"Successfully retrieved profile for: {token_data.username}")

        # Convert to UserResponse model
        return UserResponse(
            username=user_doc["username"],
            email=user_doc["email"],
            role=user_doc.get("role", "user"),
            created_at=user_doc.get("created_at"),
            last_login=user_doc.get("last_login"),
        )

    except Exception as e:
        logger.error(f"Error retrieving user profile: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user profile: {str(e)}",
        )
