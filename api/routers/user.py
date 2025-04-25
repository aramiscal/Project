from datetime import datetime
from typing import Annotated
from beanie import WriteRules
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from pydantic import ValidationError
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("user_router")

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
        logger.info(f"Starting sign-up process for username: {user.username}")

        # Check if username already exists
        existing_user = await User.find_one(User.username == user.username)
        if existing_user:
            logger.warning(f"Username already exists: {user.username}")
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"detail": "User already exists"}

        # Check if email already exists
        existing_email = await User.find_one(User.email == user.email)
        if existing_email:
            logger.warning(f"Email already in use: {user.email}")
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"detail": "Email already in use"}

        # Hash the password
        hashed_pwd = hash_password.create_hash(user.password)
        logger.info("Password hashed successfully")

        # Create the new user document
        new_user = User(
            username=user.username,
            email=user.email,
            password=hashed_pwd,
            role="user",  # Default role
            created_at=datetime.utcnow(),
        )

        logger.info(f"User document created: {new_user}")

        # Log collection name
        logger.info(f"Attempting to insert into collection: {User.Settings.name}")
        logger.info(
            f"User document _id: {str(new_user.id) if hasattr(new_user, 'id') else 'No ID yet'}"
        )

        # Save the user document to MongoDB
        try:
            # Insert into database
            logger.info("Beginning database insertion")
            result = await new_user.insert()
            logger.info(f"Insert result: {result}")

            # Verify the insert worked by querying for the user
            verification = await User.find_one(User.username == user.username)
            if verification:
                logger.info(
                    f"Verification successful - user found in database after insert"
                )
            else:
                logger.error(
                    f"Verification failed - user not found in database after insert"
                )

            return {"message": "User created successfully"}

        except ValidationError as e:
            logger.error(f"Database validation error: {str(e)}")
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"detail": f"Validation error: {str(e)}"}

        except WriteRules as e:
            logger.error(f"Database write rules error: {str(e)}")
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"detail": f"Database write error: {str(e)}"}

        except Exception as e:
            logger.error(
                f"Unexpected error during database insertion: {str(e)}", exc_info=True
            )
            response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            return {"detail": f"Failed to insert user: {str(e)}"}

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
        ## Authenticate user by verifying the user in DB
        username = form_data.username

        # Find the user in the database
        existing_user = await User.find_one(User.username == username)
        if not existing_user:
            logger.warning(f"Sign-in failed: User not found: {username}")
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
            logger.info(f"User authenticated successfully: {username}")
            # Update last login time
            existing_user.last_login = datetime.utcnow()
            await existing_user.save()
            logger.info(f"Last login time updated for: {username}")

            # Create access token
            access_token = create_access_token(
                {"username": username, "role": existing_user.role}
            )
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
        user = await User.find_one(User.username == token_data.username)
        if not user:
            logger.warning(f"User not found: {token_data.username}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        logger.info(f"Successfully retrieved profile for: {token_data.username}")
        return UserResponse(
            username=user.username,
            email=user.email,
            role=user.role,
            created_at=user.created_at,
        )
    except Exception as e:
        logger.error(f"Error retrieving user profile: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user profile: {str(e)}",
        )
