"""
FloodScope AI - Upstream Valley Flow-Path Tracer Service (Bonus Feature)
Traces the flood and debris avalanche path down the valley using Copernicus DEM 30m elevation data.
Identifies all settlements and infrastructure along the downstream trajectory with estimated arrival times.
"""

import os
import numpy as np
import rasterio
import geopandas as gpd
from shapely.geometry import Point, LineString
from typing import Dict, Any, List, Tuple

def trace_downhill_flow_path(
    dem_path: str,
    settlements_path: str,
    start_lat: float,
    start_lon: float,
    max_steps: int = 400,
    wave_velocity_ms: float = 14.0  # Approx. 50 km/h typical for high-energy GLOF/debris flow
) -> Dict[str, Any]:
    """
    Traces D8 steepest descent trajectory from a high-altitude upstream coordinate down the valley.
    Intersects the path with baseline settlement points within the valley buffer corridor.
    """
    if not os.path.exists(dem_path):
        raise FileNotFoundError(f"DEM raster not found at {dem_path}")

    with rasterio.open(dem_path) as src:
        dem_data = src.read(1)
        transform = src.transform
        height, width = dem_data.shape
        inv_transform = ~transform

    # Convert start coordinate (lon, lat) to pixel coordinates (col, row)
    cur_r, cur_c = rasterio.transform.rowcol(transform, start_lon, start_lat)

    # Clamp to raster bounds
    cur_c = max(1, min(width - 2, cur_c))
    cur_r = max(1, min(height - 2, cur_r))

    path_coords: List[Tuple[float, float]] = []
    path_elevations: List[float] = []
    visited = set()

    start_elevation = float(dem_data[cur_r, cur_c])
    
    # 8-neighbor directions (dr, dc)
    d8_directions = [
        (-1, 0), (1, 0), (0, -1), (0, 1),
        (-1, -1), (-1, 1), (1, -1), (1, 1)
    ]

    total_dist_meters = 0.0
    profile_points = []

    for step in range(max_steps):
        visited.add((cur_r, cur_c))
        lon, lat = rasterio.transform.xy(transform, cur_r, cur_c)
        current_elev = float(dem_data[cur_r, cur_c])
        path_coords.append((round(lon, 6), round(lat, 6)))
        path_elevations.append(round(current_elev, 1))

        if step > 0:
            # Approximate geodesic step distance (~40m per pixel)
            prev_lon, prev_lat = path_coords[-2]
            step_m = np.sqrt(((lon - prev_lon) * 111320 * np.cos(np.radians(lat)))**2 + ((lat - prev_lat) * 110540)**2)
            total_dist_meters += step_m

        profile_points.append({
            "step": step,
            "distance_km": round(total_dist_meters / 1000.0, 2),
            "elevation_m": round(current_elev, 1),
            "lat": round(lat, 5),
            "lon": round(lon, 5)
        })

        # Find neighbor with steepest downward drop
        best_r, best_c = cur_r, cur_c
        best_elev = current_elev

        for dr, dc in d8_directions:
            nr, nc = cur_r + dr, cur_c + dc
            if 0 <= nr < height and 0 <= nc < width:
                if (nr, nc) not in visited:
                    neighbor_elev = dem_data[nr, nc]
                    if neighbor_elev < best_elev:
                        best_elev = neighbor_elev
                        best_r, best_c = nr, nc

        # If reached a pit or flat valley floor boundary, advance south down the valley gradient
        if best_r == cur_r and best_c == cur_c:
            # Valley drainage generally slopes south (increasing row index)
            if cur_r + 1 < height - 1 and (cur_r + 1, cur_c) not in visited:
                best_r = cur_r + 1
            else:
                break

        cur_r, cur_c = best_r, best_c

    if len(path_coords) < 2:
        # Fallback to create a valid line
        path_coords.append((path_coords[0][0] + 0.001, path_coords[0][1] - 0.005))

    flow_line = LineString(path_coords)
    total_path_length_km = round(total_dist_meters / 1000.0, 2)
    end_elevation = path_elevations[-1] if path_elevations else start_elevation
    vertical_drop_m = round(start_elevation - end_elevation, 1)

    # Intersect with settlements
    settlements_at_risk = []
    if os.path.exists(settlements_path):
        settlements_gdf = gpd.read_file(settlements_path)
        
        # Buffer path in meters (approx. 0.005 degrees ~ 550m river corridor width)
        corridor_buffer_deg = 0.005
        corridor_polygon = flow_line.buffer(corridor_buffer_deg)

        for _, row in settlements_gdf.iterrows():
            geom = row.geometry
            if corridor_polygon.contains(geom):
                # Calculate distance along path to closest point
                proj_dist_deg = flow_line.project(geom)
                dist_along_km = round((proj_dist_deg / flow_line.length) * total_path_length_km, 2)
                
                # Estimated arrival time in minutes (based on wave velocity)
                arrival_min = max(2, int(round((dist_along_km * 1000.0) / (wave_velocity_ms * 60.0))))
                
                risk_level = "CRITICAL" if arrival_min < 15 else "HIGH" if arrival_min < 35 else "MODERATE"

                settlements_at_risk.append({
                    "id": row.get("id", "settlement"),
                    "name": row.get("name", "Unnamed Settlement"),
                    "population": int(row.get("population", 500)),
                    "distance_downstream_km": dist_along_km,
                    "est_arrival_minutes": arrival_min,
                    "risk_level": risk_level,
                    "lat": round(geom.y, 5),
                    "lon": round(geom.x, 5)
                })

    # Sort settlements by distance downstream
    settlements_at_risk.sort(key=lambda s: s["distance_downstream_km"])

    flow_path_geojson = {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": path_coords
        },
        "properties": {
            "name": "Upstream Debris/Flood Hazard Trajectory",
            "start_elevation_m": start_elevation,
            "end_elevation_m": end_elevation,
            "vertical_drop_m": vertical_drop_m,
            "length_km": total_path_length_km,
            "num_settlements_in_corridor": len(settlements_at_risk)
        }
    }

    return {
        "start_point": {"lat": start_lat, "lon": start_lon, "elevation_m": start_elevation},
        "end_point": {"lat": path_coords[-1][1], "lon": path_coords[-1][0], "elevation_m": end_elevation},
        "total_path_length_km": total_path_length_km,
        "total_vertical_drop_m": vertical_drop_m,
        "flow_path_geojson": flow_path_geojson,
        "elevation_profile": profile_points[::max(1, len(profile_points)//20)],  # Sample ~20 points for chart
        "settlements_at_risk": settlements_at_risk
    }
