"""
FloodScope AI - Infrastructure Analysis Service
Overlays OSM infrastructure (buildings, roads, bridges) with candidate flood extent.
Strictly distinguishes between "potentially affected / candidate disruption" vs "confirmed damage".
"""

import geopandas as gpd
from shapely.geometry import Point, LineString, Polygon
from typing import Dict, Any, Tuple
import os

def analyze_infrastructure(
    flood_gdf: gpd.GeoDataFrame,
    osm_buildings_gdf: gpd.GeoDataFrame,
    osm_roads_gdf: gpd.GeoDataFrame,
    osm_bridges_gdf: gpd.GeoDataFrame,
    bridge_buffer_meters: float = 25.0
) -> Tuple[gpd.GeoDataFrame, gpd.GeoDataFrame, gpd.GeoDataFrame, Dict[str, Any]]:
    """
    Performs spatial overlays to determine potentially affected infrastructure:
    - Buildings intersecting candidate flood polygons
    - Roads intersecting candidate flood polygons (calculates affected length in km)
    - Bridges intersecting or within proximity (buffer) of candidate flood polygons

    Note: Following hackathon guidelines, all results are explicitly tagged as
    'potentially_affected' rather than confirmed physical structural damage.
    """
    # Ensure all coordinate reference systems match
    target_crs = flood_gdf.crs or "EPSG:4326"
    
    if osm_buildings_gdf.crs != target_crs:
        osm_buildings_gdf = osm_buildings_gdf.to_crs(target_crs)
    if osm_roads_gdf.crs != target_crs:
        osm_roads_gdf = osm_roads_gdf.to_crs(target_crs)
    if osm_bridges_gdf.crs != target_crs:
        osm_bridges_gdf = osm_bridges_gdf.to_crs(target_crs)

    if flood_gdf.empty:
        empty_buildings = osm_buildings_gdf.copy()
        empty_buildings["status"] = "unaffected"
        empty_roads = osm_roads_gdf.copy()
        empty_roads["status"] = "unaffected"
        empty_bridges = osm_bridges_gdf.copy()
        empty_bridges["status"] = "unaffected"
        
        return empty_buildings, empty_roads, empty_bridges, {
            "total_buildings": len(osm_buildings_gdf),
            "potentially_affected_buildings": 0,
            "total_road_length_km": 0.0,
            "potentially_affected_road_km": 0.0,
            "total_bridges": len(osm_bridges_gdf),
            "potentially_affected_bridges": 0,
            "spatial_rule_applied": "No flood extent detected."
        }

    # Combined flood union for fast intersection
    flood_union = flood_gdf.union_all() if hasattr(flood_gdf, "union_all") else flood_gdf.unary_union

    # 1. Buildings analysis
    # Spatial rule: building polygon intersects candidate flood extent
    buildings_affected_mask = osm_buildings_gdf.intersects(flood_union)
    affected_buildings = osm_buildings_gdf[buildings_affected_mask].copy()
    affected_buildings["status"] = "potentially_affected"
    affected_buildings["spatial_rule"] = "Polygon intersection with candidate flood extent"
    affected_buildings["damage_certainty"] = "candidate_exposure_unverified"

    # 2. Roads analysis
    # Convert roads to metric projection for accurate length calculation (~UTM 45N for Nepal: EPSG:32645)
    metric_crs = "EPSG:32645"
    roads_metric = osm_roads_gdf.to_crs(metric_crs)
    flood_metric_gdf = flood_gdf.to_crs(metric_crs)
    flood_metric = flood_metric_gdf.union_all() if hasattr(flood_metric_gdf, "union_all") else flood_metric_gdf.unary_union

    total_road_length_km = float(roads_metric.length.sum() / 1000.0)

    # Intersect road lines with flood extent
    road_intersections = roads_metric.intersection(flood_metric)
    affected_road_lengths = road_intersections.length / 1000.0  # in km
    
    affected_roads_mask = affected_road_lengths > 0.001  # > 1 meter
    affected_roads = osm_roads_gdf[affected_roads_mask].copy()
    affected_roads["status"] = "potentially_affected"
    affected_roads["intersecting_length_km"] = affected_road_lengths[affected_roads_mask].round(3)
    affected_roads["spatial_rule"] = "Line segment overlap with candidate flood extent"
    affected_roads["damage_certainty"] = "candidate_disruption_unverified"

    potentially_affected_road_km = float(affected_road_lengths.sum())

    # 3. Bridges analysis
    # Spatial rule: Bridge location inside or within 25m buffer of candidate flood
    # (bridges over swollen rivers may be exposed to scouring or overtopping)
    bridges_metric = osm_bridges_gdf.to_crs(metric_crs)
    bridges_buffered = bridges_metric.buffer(bridge_buffer_meters)
    affected_bridges_mask = bridges_buffered.intersects(flood_metric)

    affected_bridges = osm_bridges_gdf[affected_bridges_mask].copy()
    affected_bridges["status"] = "potentially_affected"
    affected_bridges["spatial_rule"] = f"Within {bridge_buffer_meters}m proximity or intersection of candidate flood"
    affected_bridges["damage_certainty"] = "candidate_exposure_unverified"

    stats = {
        "total_buildings": len(osm_buildings_gdf),
        "potentially_affected_buildings": len(affected_buildings),
        "total_road_length_km": round(total_road_length_km, 2),
        "potentially_affected_road_km": round(potentially_affected_road_km, 2),
        "total_bridges": len(osm_bridges_gdf),
        "potentially_affected_bridges": len(affected_bridges),
        "spatial_rule_applied": (
            "Buildings: direct intersection; "
            f"Roads: centerline segment overlap; "
            f"Bridges: direct intersection or {bridge_buffer_meters}m buffer."
        )
    }

    return affected_buildings, affected_roads, affected_bridges, stats

def export_infrastructure_geojson(
    buildings_gdf: gpd.GeoDataFrame,
    roads_gdf: gpd.GeoDataFrame,
    bridges_gdf: gpd.GeoDataFrame,
    output_dir: str
):
    """
    Exports affected infrastructure layers as standard GeoJSON files.
    """
    os.makedirs(output_dir, exist_ok=True)
    buildings_gdf.to_file(os.path.join(output_dir, "affected_buildings.geojson"), driver="GeoJSON")
    roads_gdf.to_file(os.path.join(output_dir, "affected_roads.geojson"), driver="GeoJSON")
    bridges_gdf.to_file(os.path.join(output_dir, "affected_bridges.geojson"), driver="GeoJSON")
