import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB connection
from lib.db import client, db, ensure_indexes

# Routers
from routers.standards import router as standards_router
from routers.analysis import router as analysis_router


# Startup runs before the yield, shutdown after it.
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.index_task = asyncio.create_task(ensure_indexes())
    yield
    client.close()


# Create the main app without a prefix
app = FastAPI(
    title="MANAK AI Backend — SIH 26108",
    description="Intelligent discovery of Indian Standards (IS Standards) for public procurement specifications",
    lifespan=lifespan,
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {
        "service": "MANAK AI Recommendation Engine",
        "version": "1.0.0",
        "problem_statement": "SIH 26108",
        "status": "online",
        "bureau_reference": "Bureau of Indian Standards (BIS)",
    }


# Include resource sub-routers onto api_router
api_router.include_router(standards_router)
api_router.include_router(analysis_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# All resource routes must be registered before this final include.
app.include_router(api_router)
