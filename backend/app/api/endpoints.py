"""
FloodScope AI - API Endpoints
Connects geospatial processing, infrastructure overlays, graph accessibility,
and AI situation copilot with the React Leaflet dashboard.
"""

from fastapi import APIRouter, HTTPException, Response
from typing import Dict, Any, Optional
import os
import json
import uuid
from datetime import datetime
import rasterio
import geopandas as gpd

from backend.app.schemas.analysis import (
    AnalysisRequest,
    AnalysisStatus,
    FloodExtentSummary,
    InfrastructureStats,
    AccessibilityResults,
    ReportGenerateRequest,
    ReportResponse
)
from backend.app.services.satellite import validate_sentinel1_pair
from backend.app.services.flood_detection import detect_flood_extent, export_flood_geotiff, export_flood_geojson
from backend.app.services.infrastructure import analyze_infrastructure, export_infrastructure_geojson
from backend.app.services.accessibility import analyze_accessibility, export_accessibility_geojson
from backend.app.services.reports import generate_situation_report

router = APIRouter()

# In-memory storage for analysis sessions (backed by persistent processed files)
ANALYSIS_STORE: Dict[str, Dict[str, Any]] = {}
REPORTS_STORE: Dict[str, Dict[str, Any]] = {}

SAMPLE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/sample"))
PROCESSED_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/processed"))

@router.get("/health")
def get_health():
    """Check whether the backend is running."""
    return {
        "status": "healthy",
        "service": "FloodScope AI Backend",
        "version": "1.0.0",
        "engine": "UN-SPIDER Sentinel-1 SAR + NetworkX + Gemini Copilot",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.post("/analysis/run", response_model=AnalysisStatus)
def run_analysis(request: AnalysisRequest):
    """Start flood analysis for a selected area and date pair."""
    # 0. Enforce Sentinel-1 Scene Metadata & Timing Validation
    try:
        pre_date = datetime.strptime(request.pre_event_date, "%Y-%m-%d")
        post_date = datetime.strptime(request.post_event_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Dates must be YYYY-MM-DD.")

    is_valid, validation_err = validate_sentinel1_pair(
        {"orbit_pass": request.orbit_pass, "relative_orbit": request.relative_orbit, "date": pre_date},
        {"orbit_pass": request.orbit_pass, "relative_orbit": request.relative_orbit, "date": post_date}
    )
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"Sentinel-1 Validation Error: {validation_err}")

    analysis_id = f"fs_{uuid.uuid4().hex[:8]}"
    created_at = datetime.utcnow()
    
    pre_path = os.path.join(SAMPLE_DIR, "s1_pre_20240814_vh.tif")
    post_path = os.path.join(SAMPLE_DIR, "s1_post_20240826_vh.tif")
    dem_path = os.path.join(SAMPLE_DIR, "copernicus_dem_rasuwa.tif")
    perm_path = os.path.join(SAMPLE_DIR, "permanent_water_mask.tif")

    if not os.path.exists(post_path):
        raise HTTPException(status_code=500, detail="Sample satellite rasters not initialized.")

    # 1. Satellite Processing & Flood Detection
    with rasterio.open(pre_path) as src_pre, rasterio.open(post_path) as src_post, rasterio.open(dem_path) as src_dem:
        pre_data = src_pre.read(1)
        post_data = src_post.read(1)
        dem_data = src_dem.read(1)
        transform = src_post.transform
        crs = src_post.crs.to_string() if src_post.crs else "EPSG:4326"

    # Connect permanent water mask
    perm_water_data = None
    if os.path.exists(perm_path):
        with rasterio.open(perm_path) as src_perm:
            perm_water_data = src_perm.read(1)

    cleaned_flood, flood_gdf, flood_stats = detect_flood_extent(
        pre_s1_db=pre_data,
        post_s1_db=post_data,
        transform=transform,
        crs=crs,
        dem=dem_data,
        perm_water=perm_water_data,
        slope_cutoff=request.dem_slope_cutoff_deg
    )

    # 2. Infrastructure Overlay
    buildings_gdf = gpd.read_file(os.path.join(SAMPLE_DIR, "osm_buildings_pre_event.geojson"))
    roads_gdf = gpd.read_file(os.path.join(SAMPLE_DIR, "osm_roads_pre_event.geojson"))
    bridges_gdf = gpd.read_file(os.path.join(SAMPLE_DIR, "osm_bridges_pre_event.geojson"))

    aff_bldgs, aff_roads, aff_bridges, infra_stats = analyze_infrastructure(
        flood_gdf=flood_gdf,
        osm_buildings_gdf=buildings_gdf,
        osm_roads_gdf=roads_gdf,
        osm_bridges_gdf=bridges_gdf
    )

    # 3. Accessibility & Graph Analysis using FULL baseline roads
    settlements_gdf = gpd.read_file(os.path.join(SAMPLE_DIR, "osm_settlements_pre_event.geojson"))
    facilities_gdf = gpd.read_file(os.path.join(SAMPLE_DIR, "osm_facilities_pre_event.geojson"))

    access_gdf, access_stats = analyze_accessibility(
        all_roads_gdf=roads_gdf,
        flood_gdf=flood_gdf,
        settlements_gdf=settlements_gdf,
        facilities_gdf=facilities_gdf
    )

    # Export analysis artifacts
    run_dir = os.path.join(PROCESSED_DIR, analysis_id)
    os.makedirs(run_dir, exist_ok=True)
    export_flood_geotiff(cleaned_flood, transform, os.path.join(run_dir, "flood_extent.tif"), crs=crs)
    export_flood_geojson(flood_gdf, os.path.join(run_dir, "flood_extent.geojson"))
    export_infrastructure_geojson(aff_bldgs, aff_roads, aff_bridges, run_dir)
    export_accessibility_geojson(access_gdf, os.path.join(run_dir, "accessibility_results.geojson"))

    summary = FloodExtentSummary(
        total_area_analyzed_sq_km=flood_stats["total_area_analyzed_sq_km"],
        candidate_flood_area_sq_km=flood_stats["candidate_flood_area_sq_km"],
        candidate_flood_area_hectares=flood_stats["candidate_flood_area_hectares"],
        sensor="Sentinel-1 C-Band SAR (IW Mode, VH polarization)",
        pre_event_scene="S1A_IW_GRDH_1SDV_20240814T121540 (Benchmark)",
        post_event_scene="S1A_IW_GRDH_1SDV_20240826T121540 (Benchmark)",
        orbit_track=request.relative_orbit,
        permanent_water_masked=bool(perm_water_data is not None),
        steep_slopes_masked=True,
        data_source_mode="synthetic_demo"
    )

    infra = InfrastructureStats(**infra_stats)
    access = AccessibilityResults(**access_stats)

    status_obj = AnalysisStatus(
        analysis_id=analysis_id,
        status="completed",
        created_at=created_at,
        completed_at=datetime.utcnow(),
        area_name="Nepal Rasuwa District (Synthetic Benchmark Demo)",
        data_source_mode="synthetic_demo",
        summary=summary,
        infrastructure=infra,
        accessibility=access
    )

    # Save to store
    ANALYSIS_STORE[analysis_id] = {
        "status": status_obj,
        "flood_gdf": flood_gdf,
        "buildings_gdf": aff_bldgs,
        "roads_gdf": aff_roads,
        "bridges_gdf": aff_bridges,
        "settlements_gdf": access_gdf,
        "facilities_gdf": facilities_gdf,
        "run_dir": run_dir,
        "request": request
    }

    return status_obj

@router.get("/analysis/{analysis_id}", response_model=AnalysisStatus)
def get_analysis_status(analysis_id: str):
    """Return analysis status and results."""
    # If "latest" or not found, check store or run a default run
    if analysis_id not in ANALYSIS_STORE:
        if analysis_id == "latest" and ANALYSIS_STORE:
            latest_id = list(ANALYSIS_STORE.keys())[-1]
            return ANALYSIS_STORE[latest_id]["status"]
        raise HTTPException(status_code=404, detail="Analysis ID not found.")
    return ANALYSIS_STORE[analysis_id]["status"]

@router.get("/layers/{analysis_id}")
def get_map_layers(analysis_id: str):
    """Return map-layer data (GeoJSON format) for interactive React Leaflet map."""
    if analysis_id not in ANALYSIS_STORE:
        if analysis_id == "latest" and ANALYSIS_STORE:
            analysis_id = list(ANALYSIS_STORE.keys())[-1]
        else:
            raise HTTPException(status_code=404, detail="Analysis ID not found.")

    data = ANALYSIS_STORE[analysis_id]
    
    flood_json = json.loads(data["flood_gdf"].to_json()) if not data["flood_gdf"].empty else {"type": "FeatureCollection", "features": []}
    buildings_json = json.loads(data["buildings_gdf"].to_json())
    roads_json = json.loads(data["roads_gdf"].to_json())
    bridges_json = json.loads(data["bridges_gdf"].to_json())
    settlements_json = json.loads(data["settlements_gdf"].to_json())
    facilities_json = json.loads(data["facilities_gdf"].to_json())

    # Calculate bounding box [min_lat, min_lon, max_lat, max_lon]
    bounds = [[28.12, 85.32], [28.20, 85.40]]

    return {
        "analysis_id": analysis_id,
        "bounds": bounds,
        "layers": {
            "flood_extent": flood_json,
            "buildings": buildings_json,
            "roads": roads_json,
            "bridges": bridges_json,
            "settlements": settlements_json,
            "facilities": facilities_json
        }
    }

@router.get("/infrastructure/{analysis_id}", response_model=InfrastructureStats)
def get_infrastructure_stats(analysis_id: str):
    """Return affected infrastructure statistics."""
    if analysis_id not in ANALYSIS_STORE:
        if analysis_id == "latest" and ANALYSIS_STORE:
            analysis_id = list(ANALYSIS_STORE.keys())[-1]
        else:
            raise HTTPException(status_code=404, detail="Analysis ID not found.")
    return ANALYSIS_STORE[analysis_id]["status"].infrastructure

@router.get("/accessibility/{analysis_id}", response_model=AccessibilityResults)
def get_accessibility_results(analysis_id: str):
    """Return connectivity results."""
    if analysis_id not in ANALYSIS_STORE:
        if analysis_id == "latest" and ANALYSIS_STORE:
            analysis_id = list(ANALYSIS_STORE.keys())[-1]
        else:
            raise HTTPException(status_code=404, detail="Analysis ID not found.")
    return ANALYSIS_STORE[analysis_id]["status"].accessibility

@router.post("/reports/generate", response_model=ReportResponse)
def generate_report(req: ReportGenerateRequest):
    """Generate a situation report from validated results in English or Nepali."""
    analysis_id = req.analysis_id
    if analysis_id not in ANALYSIS_STORE:
        if analysis_id == "latest" and ANALYSIS_STORE:
            analysis_id = list(ANALYSIS_STORE.keys())[-1]
        else:
            raise HTTPException(status_code=404, detail="Analysis ID not found.")

    sess = ANALYSIS_STORE[analysis_id]["status"]
    metrics_bundle = {
        "analysis_id": analysis_id,
        "area_name": sess.area_name,
        "data_source_mode": sess.data_source_mode,
        "summary": sess.summary.model_dump(),
        "infrastructure": sess.infrastructure.model_dump(),
        "accessibility": sess.accessibility.model_dump()
    }

    report = generate_situation_report(metrics_bundle, language=req.language)
    REPORTS_STORE[report["report_id"]] = report
    return ReportResponse(**report)

@router.get("/reports/{report_id}/download")
def download_report(report_id: str):
    """Download the generated report as Markdown file."""
    if report_id not in REPORTS_STORE:
        raise HTTPException(status_code=404, detail="Report ID not found.")
        
    report = REPORTS_STORE[report_id]
    content = report["content_markdown"]
    filename = f"floodscope_report_{report['language']}_{report_id}.md"

    return Response(
        content=content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
