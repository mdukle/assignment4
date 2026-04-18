from database import init
from typing import Annotated

from fastapi import APIRouter, FastAPI, HTTPException, Path
from contextlib import asynccontextmanager
from fastapi.responses import FileResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles

from tracker_routes import tracker_router
from user_router import user_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    await init()
    print("Database connected")

    yield

    # Shutdown logic (optional)
    print("Shutting down...")


app = FastAPI(
    title="Lab Reagent Tracker",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/")
async def home():
    return FileResponse("./frontend/index.html")


app.include_router(tracker_router, tags=["Reagents"], prefix="/reagents")
app.include_router(user_router, tags=["Users"], prefix="/users")


app.mount("/", StaticFiles(directory="frontend"), name="static")


@app.exception_handler(HTTPException)
async def my_http_exception_handler(request, ex):
    return PlainTextResponse(str(ex.detail), status_code=ex.status_code)
