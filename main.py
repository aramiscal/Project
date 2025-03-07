from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from list_routes import list_router

app = FastAPI(tile="Shopping List")
app.include_router(list_router, prefix="/list")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"])

@app.get("/")
async def welcome() -> dict:
    return FileResponse("./frontend/index.html")

app.mount("/", StaticFiles(directory="frontend"), name="static")