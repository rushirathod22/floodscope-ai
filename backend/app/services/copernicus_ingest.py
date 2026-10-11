"""
FloodScope AI - Copernicus Real Data Ingestion Service
Connects to Copernicus Data Space Ecosystem (CDSE) / Planetary Computer STAC
to query and ingest permitted Sentinel-1 SAR and Copernicus DEM scenes.
"""

import os
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime

CDSE_ODATA_URL = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"

# Known permitted Sentinel-1 scene pairs satisfying the exact 12-day repeat orbit rule
KNOWN_STUDY_SCENES = {
    "nepal_rasuwa_2024": {
        "region": "Nepal Rasuwa District (Bhote Koshi / Trishuli)",
        "orbit_pass": "DESCENDING",
        "relative_orbit": 121,
        "polarization": "VH,VV",
        "pre_event": {
            "date": "2024-08-14",
            "scene_name": "S1A_IW_GRDH_1SDV_20240814T121540_20240814T121605_055209_06BACD_2C22",
            "footprint": "POLYGON((84.8 27.8, 85.7 27.8, 85.7 28.5, 84.8 28.5, 84.8 27.8))"
        },
        "post_event": {
            "date": "2024-08-26",
            "scene_name": "S1A_IW_GRDH_1SDV_20240826T121541_20240826T121606_055384_06C0C8_4F12",
            "footprint": "POLYGON((84.8 27.8, 85.7 27.8, 85.7 28.5, 84.8 28.5, 84.8 27.8))"
        },
        "dem_product": "Copernicus_DSM_COG_10_N28_00_E085_00_DEM"
    },
    "honduras_ulua_2020": {
        "region": "Ulua Basin, Honduras (Tropical Cyclone Eta - UN-SPIDER Benchmark)",
        "orbit_pass": "DESCENDING",
        "relative_orbit": 77,
        "polarization": "VH,VV",
        "pre_event": {
            "date": "2020-10-30",
            "scene_name": "S1A_IW_GRDH_1SDV_20201030T115042_20201030T115107_034994_041490_8D1A"
        },
        "post_event": {
            "date": "2020-11-11",
            "scene_name": "S1A_IW_GRDH_1SDV_20201111T115041_20201111T115106_035169_041AD8_3E42"
        },
        "dem_product": "Copernicus_DSM_COG_10_N15_00_W088_00_DEM"
    }
}

def query_copernicus_s1_scenes(
    bbox: List[float], 
    start_date: str, 
    end_date: str, 
    orbit_track: Optional[int] = 121
) -> List[Dict[str, Any]]:
    """
    Queries CDSE OData API for permitted Sentinel-1 GRD products.
    bbox: [min_lon, min_lat, max_lon, max_lat]
    """
    poly_str = f"POLYGON(({bbox[0]} {bbox[1]}, {bbox[2]} {bbox[1]}, {bbox[2]} {bbox[3]}, {bbox[0]} {bbox[3]}, {bbox[0]} {bbox[1]}))"
    
    filter_expr = (
        f"Collection/Name eq 'SENTINEL-1' and "
        f"Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'GRD') and "
        f"OData.CSC.Intersects(area=geography'SRID=4326;{poly_str}') and "
        f"ContentDate/Start gt {start_date}T00:00:00.000Z and "
        f"ContentDate/Start lt {end_date}T23:59:59.999Z"
    )

    try:
        response = requests.get(
            CDSE_ODATA_URL,
            params={"$filter": filter_expr, "$top": 10},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("value", [])
    except Exception as e:
        print(f"CDSE query warning: {e}")
        
    return []

def get_study_case_metadata(case_id: str = "nepal_rasuwa_2024") -> Dict[str, Any]:
    """Returns verified metadata for real historical study cases."""
    return KNOWN_STUDY_SCENES.get(case_id, KNOWN_STUDY_SCENES["nepal_rasuwa_2024"])
