from datetime import datetime
import traceback
from typing import Annotated
from beanie import WriteRules
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from pydantic import ValidationError

from api.auth.jwt_auth import Token, TokenData, create_access_token, decode_jwt_token
from api.models.user import User, UserRequest, UserResponse

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class HashPassword:
    def create_hash(self, password: str):
        return pwd_context.hash(password)

    def verify_hash(self, input_password: str, hashed_password: str):
        return pwd_context.verify(input_password, hashed_password)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
hash_password = HashPassword()


def get_user(token: Annotated[str, Depends(oauth2_scheme)]) -> TokenData:
    print(token)
    return decode_jwt_token(token)


user_router = APIRouter()


@user_router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=dict)
async def sign_up(user: UserRequest, response: Response):
    """
    Sign up a new user and store in the database
    """
    logger.info(f"Signup request received for username: {user.username}")

    try:
        # Check if username already exists - direct MongoDB query approach
        existing_user = await User.find_one(User.username == user.username)
        if existing_user:
            logger.warning(f"Username {user.username} already exists")
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"detail": "User already exists"}

        # Check if email already exists - direct MongoDB query approach
        existing_email = await User.find_one(User.email == user.email)
        if existing_email:
            logger.warning(f"Email {user.email} already in use")
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"detail": "Email already in use"}

        # Hash the password
        hashed_pwd = hash_password.create_hash(user.password)

        # Create the new user document
        logger.info(f"Creating user object for {user.username}")
        new_user = User(
            username=user.username,
            email=user.email,
            password=hashed_pwd,
            role="user",  # Default role
            created_at=datetime.utcnow(),
        )

        # Save the user document to MongoDB
        logger.info(f"Attempting to save user {user.username} to database")
        try:
            # Insert into database
            result = await new_user.insert()
            logger.info(
                f"User {user.username} successfully created with ID: {result.id}"
            )

            # Check if the user was actually saved
            saved_user = await User.find_one(User.username == user.username)
            if saved_user:
                logger.info(
                    f"Successfully verified user {user.username} exists in database"
                )
            else:
                logger.error(
                    f"Failed to verify user {user.username} in database after creation"
                )

            return {"message": "User created successfully"}

        except ValidationError as e:
            logger.error(f"Validation error creating user: {str(e)}")
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"detail": f"Validation error: {str(e)}"}

        except WriteRules as e:
            logger.error(f"Write rules violation creating user: {str(e)}")
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"detail": f"Database write error: {str(e)}"}

    except Exception as e:
        # Log detailed error with traceback
        logger.error(f"Unexpected error creating user {user.username}: {str(e)}")
        logger.error(traceback.format_exc())
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {"detail": f"Failed to create user: {str(e)}"}


@user_router.post("/sign-in", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], response: Response
) -> Token:
    """
    Authenticate user and provide access token
    """
    try:
        ## Authenticate user by verifying the user in DB
        username = form_data.username

        # Find the user in the database
        existing_user = await User.find_one(User.username == username)
        if not existing_user:
            logger.warning(f"Sign-in attempt with non-existent username: {username}")
            response.status_code = status.HTTP_401_UNAUTHORIZED
            return {
                "access_token": "",
                "token_type": "bearer",
                "detail": "Username or Password is invalid.",
            }

        # Verify password
        authenticated = hash_password.verify_hash(
            form_data.password, existing_user.password
        )

        if authenticated:
            # Update last login time
            existing_user.last_login = datetime.utcnow()
            await existing_user.save()

            # Create access token
            access_token = create_access_token(
                {"username": username, "role": existing_user.role}
            )
            logger.info(f"User {username} successfully authenticated")
            return Token(access_token=access_token)
        else:
            logger.warning(f"Failed authentication attempt for user: {username}")
            response.status_code = status.HTTP_401_UNAUTHORIZED
            return {
                "access_token": "",
                "token_type": "bearer",
                "detail": "Invalid username or password",
            }

    except Exception as e:
        logger.error(f"Error during sign-in: {str(e)}")
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {
            "access_token": "",
            "token_type": "bearer",
            "detail": f"Sign-in error: {str(e)}",
        }


@user_router.get("/me", response_model=UserResponse)
async def get_current_user(token_data: Annotated[TokenData, Depends(get_user)]):
    """
    Get current user information
    """
    try:
        user = await User.find_one(User.username == token_data.username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        return UserResponse(
            username=user.username,
            email=user.email,
            role=user.role,
            created_at=user.created_at,
        )
    except Exception as e:
        logger.error(f"Error retrieving user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user profile: {str(e)}",
        )
