from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from database.db_context import init_database
from routers.list_routes import list_router
from routers.user import user_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # on startup event
    print("Application Starts...")
    await init_database()
    # on shutdown event
    yield 
    print("Application Ends...")

app = FastAPI(title="Shopping List", version="2.0.0", lifespan=lifespan)

app.include_router(list_router, prefix="/list")
app.include_router(user_router, tags=["Users"], prefix="/users")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"])

@app.get("/")
async def welcome() -> dict:
    return FileResponse("../frontend/index.html")

app.mount("/", StaticFiles(directory="../frontend"), name="static")