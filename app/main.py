"""FastAPI main application entry point."""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .database import engine
from . import models
from .routers import users, games

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Snake Game API",
    description="Web-based Snake game with user authentication and score tracking",
    version="1.0.0"
)

# Include routers
app.include_router(users.router)
app.include_router(games.router)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    """Serve the login page."""
    return FileResponse("static/index.html")


@app.get("/game")
async def game_page():
    """Serve the game page."""
    return FileResponse("static/game.html")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "Snake Game API is running"}
