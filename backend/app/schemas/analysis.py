from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class AnalysisRequest(BaseModel):
    area_id: str = Field(default="nepal_rasuwa", description="Region or AOI identifier")
    pre_event_date: str = Field(default="2024-08-14", description="Pre-event Sentinel-1 acquisition date (YYYY-MM-DD)")
    post_event_date: str = Field(default="2024-08-26", description="Post-event Sentinel-1 acquisition date (YYYY-MM-DD, 12-day orbit)")
    orbit_pass: str = Field(default="DESCENDING", description="Sentinel-1 orbit pass: ASCENDING or DESCENDING")
    relative_orbit: int = Field(default=121, description="Relative orbit number to ensure identical radar geometry")
    polarization: str = Field(default="VH", description="Polarization channel: VH (cross-pol) or VV (co-pol)")
    threshold_method: str = Field(default="otsu_minimum_hybrid", description="Thresholding method: otsu, minimum, or hybrid UN-SPIDER")
    dem_slope_cutoff_deg: float = Field(default=15.0, description="Exclude slopes greater than degrees to prevent radar shadow false positives")

class InfrastructureStats(BaseModel):
    total_buildings: int
    potentially_affected_buildings: int
    total_road_length_km: float
    potentially_affected_road_km: float
    total_bridges: int
    potentially_affected_bridges: int
    spatial_rule_applied: str

class DisconnectedSettlement(BaseModel):
    id: str
    name: str
    population_est: int
    isolated: bool
    nearest_hospital: str
    distance_km: float
    pre_event_travel_possible: bool
    post_event_travel_possible: bool
    status: str

class AccessibilityResults(BaseModel):
    total_settlements: int
    disconnected_settlements_count: int
    accessible_settlements_count: int
    disconnected_details: List[DisconnectedSettlement]
    disrupted_edge_count: int
    methodology: str

class FloodExtentSummary(BaseModel):
    total_area_analyzed_sq_km: float
    candidate_flood_area_sq_km: float
    candidate_flood_area_hectares: float
    sensor: str
    pre_event_scene: str
    post_event_scene: str
    orbit_track: int
    permanent_water_masked: bool
    steep_slopes_masked: bool

class AnalysisStatus(BaseModel):
    analysis_id: str
    status: str  # pending, processing, completed, failed
    created_at: datetime
    completed_at: Optional[datetime] = None
    area_name: str
    summary: Optional[FloodExtentSummary] = None
    infrastructure: Optional[InfrastructureStats] = None
    accessibility: Optional[AccessibilityResults] = None
    error: Optional[str] = None

class ReportGenerateRequest(BaseModel):
    analysis_id: str
    language: str = Field(default="en", description="Report language: 'en' (English) or 'ne' (Nepali)")
    notes: Optional[str] = None

class ReportResponse(BaseModel):
    report_id: str
    analysis_id: str
    language: str
    title: str
    generated_at: datetime
    content_markdown: str
    structured_metrics: Dict[str, Any]
    uncertainties_and_limitations: List[str]
    citations: List[str]
