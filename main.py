from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from list_routes import list_router

app = FastAPI(tile="Shopping List")
app.include_router(list_router, prefix="/list")

@app.get("/")
async def welcome() -> dict:
    return FileResponse("./frontend/index.html")

app.mount("/", StaticFiles(directory="frontend"), name="static")