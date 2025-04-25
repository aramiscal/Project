from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from api.database.db_context import init_database
from api.routers.list_routes import list_router
from api.routers.user import user_router

import logging

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("api_debug.log")],
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # on startup event
    await init_database()
    # on shutdown event
    yield


app = FastAPI(title="Shopping List", version="2.0.0", lifespan=lifespan)

app.include_router(list_router, tags=["List"], prefix="/list")
app.include_router(user_router, tags=["Users"], prefix="/users")

# Updated CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,  # Cache preflight requests for 10 minutes
)


@app.get("/ping")
async def ping():
    """Simple ping endpoint to test if the API is working"""
    return {"status": "ok", "message": "API is running"}


@app.options("/users/signup")
async def options_signup():
    """Handle OPTIONS request for the signup endpoint (helps with CORS)"""
    return {"status": "ok"}


@app.get("/")
async def welcome() -> dict:
    return FileResponse("./frontend/index.html")


app.mount("/", StaticFiles(directory="./frontend"), name="static")


print("Server starting up...")
