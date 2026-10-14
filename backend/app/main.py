"""
FloodScope AI - Main FastAPI Application
Satellite-Based Flood Damage & Rescue Intelligence
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from backend.app.api.endpoints import router as api_router, run_analysis
from backend.app.schemas.analysis import AnalysisRequest
from backend.app.services.sample_data import generate_sample_study_dataset

SAMPLE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/sample"))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure sample georeferenced data is generated
    if not os.path.exists(os.path.join(SAMPLE_DIR, "copernicus_dem_rasuwa.tif")):
        print("Generating initial sample satellite and OSM datasets...")
        generate_sample_study_dataset(SAMPLE_DIR)
    
    # Pre-warm with an initial baseline analysis so the dashboard opens with full data immediately
    try:
        req = AnalysisRequest()
        run_analysis(req)
        print("Initial baseline analysis generated successfully!")
    except Exception as e:
        print(f"Warning during pre-warm analysis: {e}")
        
    yield

app = FastAPI(
    title="FloodScope AI Backend API",
    description="Satellite-Based Flood Damage & Rescue Intelligence API (Sentinel-1 SAR + NetworkX + AI Copilot)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=True)
