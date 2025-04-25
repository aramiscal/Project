from datetime import datetime
from typing import Annotated
from beanie import WriteRules
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from pydantic import ValidationError

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
    """
    Sign up a new user and store in the database
    """
    try:
        # Check if username already exists
        existing_user = await User.find_one(User.username == user.username)
        if existing_user:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"detail": "User already exists"}

        # Check if email already exists
        existing_email = await User.find_one(User.email == user.email)
        if existing_email:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"detail": "Email already in use"}

        # Hash the password
        hashed_pwd = hash_password.create_hash(user.password)

        # Create the new user document
        new_user = User(
            username=user.username,
            email=user.email,
            password=hashed_pwd,
            role="user",  # Default role
            created_at=datetime.utcnow(),
        )

        # Save the user document to MongoDB
        try:
            # Insert into database
            result = await new_user.insert()

            return {"message": "User created successfully"}

        except ValidationError as e:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"detail": f"Validation error: {str(e)}"}

        except WriteRules as e:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"detail": f"Database write error: {str(e)}"}

    except Exception as e:
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user profile: {str(e)}",
        )
