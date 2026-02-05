"""Scuttlebox Backend - FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import get_settings
from .routers import status, sessions, commands, files, config, cron, queue, logs


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    settings = get_settings()
    print(f"🎱 Scuttlebox Backend starting...")
    print(f"   Gateway: {settings.openclaw_gateway_url}")
    print(f"   Workspace: {settings.openclaw_workspace}")
    yield
    # Shutdown
    print("🎱 Scuttlebox Backend shutting down...")


app = FastAPI(
    title="Scuttlebox API",
    description="Backend API for the Scuttlebox web interface",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(status.router)
app.include_router(sessions.router)
app.include_router(commands.router)
app.include_router(files.router)
app.include_router(config.router)
app.include_router(cron.router)
app.include_router(queue.router)
app.include_router(logs.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Scuttlebox API",
        "version": "0.1.0",
        "status": "running",
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"ok": True}
