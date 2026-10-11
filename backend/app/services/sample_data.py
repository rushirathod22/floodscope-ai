"""
FloodScope AI - Sample Dataset Generator
Creates georeferenced Sentinel-1 SAR scenes (pre-event and post-event GeoTIFFs),
Copernicus DEM (GeoTIFF), and pre-event OpenStreetMap vectors (buildings, roads,
bridges, settlements, facilities) for the Nepal Rasuwa / Trishuli River corridor.
"""

import os
import numpy as np
import rasterio
from rasterio.transform import from_origin
import geopandas as gpd
from shapely.geometry import Point, LineString, Polygon, box
import json

def generate_sample_study_dataset(target_dir: str):
    """
    Generates realistic georeferenced raster and vector data for Nepal Rasuwa District.
    Bounding Box: [85.32°E, 28.12°N, 85.40°E, 28.20°N] (~8 km x 9 km AOI)
    """
    os.makedirs(target_dir, exist_ok=True)
    
    # Raster dimensions: 200 x 200 pixels at ~40m resolution
    width = 200
    height = 200
    lon_min, lat_max = 85.32, 28.20
    pixel_size = 0.0004  # ~40 meters in degrees
    transform = from_origin(lon_min, lat_max, pixel_size, pixel_size)
    crs = "EPSG:4326"

    # 1. Generate Copernicus DEM
    # Mountain valley: high elevation on east/west flanks (2800m), low in center river gorge (1500m)
    x = np.linspace(-1, 1, width)
    y = np.linspace(-1, 1, height)
    xx, yy = np.meshgrid(x, y)
    
    # Valley along a meandering path
    river_path_x = 0.2 * np.sin(yy * 3.0)
    dist_to_river = np.abs(xx - river_path_x)
    
    elevation = 1500.0 + (dist_to_river**1.2) * 1600.0 + np.random.normal(0, 15, (height, width))
    elevation = np.clip(elevation, 1400.0, 3200.0).astype(np.float32)

    dem_path = os.path.join(target_dir, "copernicus_dem_rasuwa.tif")
    with rasterio.open(
        dem_path, 'w', driver='GTiff', height=height, width=width,
        count=1, dtype='float32', crs=crs, transform=transform, nodata=-9999
    ) as dst:
        dst.write(elevation, 1)

    # 2. Generate Permanent Water Mask (River centerline pre-flood)
    permanent_water = (dist_to_river < 0.04).astype(np.uint8)

    # 3. Pre-event Sentinel-1 VH Backscatter (in dB, typical land: -13 dB, river: -22 dB)
    pre_s1 = -13.0 + np.random.normal(0, 1.8, (height, width))
    pre_s1[permanent_water == 1] = -21.5 + np.random.normal(0, 1.0, np.sum(permanent_water == 1))
    pre_s1 = pre_s1.astype(np.float32)

    pre_s1_path = os.path.join(target_dir, "s1_pre_20240814_vh.tif")
    with rasterio.open(
        pre_s1_path, 'w', driver='GTiff', height=height, width=width,
        count=1, dtype='float32', crs=crs, transform=transform, nodata=-99
    ) as dst:
        dst.write(pre_s1, 1)

    # 4. Post-event Sentinel-1 VH Backscatter (with substantial flood inundation in valley floor)
    post_s1 = pre_s1.copy()
    
    # Flood zone spreads across river basin where elevation is low and dist_to_river is moderate
    flood_zone = (dist_to_river < 0.16) & (elevation < 1720.0)
    post_s1[flood_zone] = -21.0 + np.random.normal(0, 1.2, np.sum(flood_zone))
    post_s1 = post_s1.astype(np.float32)

    post_s1_path = os.path.join(target_dir, "s1_post_20240826_vh.tif")
    with rasterio.open(
        post_s1_path, 'w', driver='GTiff', height=height, width=width,
        count=1, dtype='float32', crs=crs, transform=transform, nodata=-99
    ) as dst:
        dst.write(post_s1, 1)

    # 5. Pre-event OSM Road Network
    # Main trunk highway (Pasang Lhamu Highway) running North-South along the river valley
    lats = np.linspace(28.125, 28.195, 30)
    hw_coords = []
    for lt in lats:
        norm_y = (28.20 - lt) / (pixel_size * height) * 2 - 1
        rx = 0.2 * np.sin(norm_y * 3.0)
        ln = lon_min + ((rx + 1) / 2) * (pixel_size * width) + 0.002
        hw_coords.append((ln, lt))

    highway_geom = LineString(hw_coords)
    
    # Lateral spur roads to higher mountain villages
    spur1 = LineString([hw_coords[8], (85.335, hw_coords[8][1] + 0.005), (85.330, 28.150)])
    spur2 = LineString([hw_coords[15], (85.375, hw_coords[15][1] + 0.003), (85.385, 28.165)])
    spur3 = LineString([hw_coords[22], (85.332, hw_coords[22][1] - 0.004), (85.328, 28.180)])
    river_crossing_spur = LineString([hw_coords[12], (hw_coords[12][0] - 0.015, hw_coords[12][1])])

    roads_gdf = gpd.GeoDataFrame({
        "id": ["road_hwy_main", "road_spur_briddhim", "road_spur_thuman", "road_spur_khangjim", "road_crossing_west"],
        "name": [
            "Pasang Lhamu Highway (Primary)",
            "Briddhim Rural Access Road",
            "Thuman Hill Track",
            "Khangjim Ridge Trail",
            "Trishuli West Bank Connector"
        ],
        "highway": ["primary", "unclassified", "track", "track", "secondary"],
        "surface": ["paved", "unpaved", "ground", "ground", "paved"],
        "geometry": [highway_geom, spur1, spur2, spur3, river_crossing_spur]
    }, crs=crs)

    roads_path = os.path.join(target_dir, "osm_roads_pre_event.geojson")
    roads_gdf.to_file(roads_path, driver="GeoJSON")

    # 6. Pre-event OSM Bridges
    # Bridges over the main river channel
    bridge1_pt = Point(hw_coords[12][0] - 0.004, hw_coords[12][1])
    bridge2_pt = Point(hw_coords[18][0] - 0.001, hw_coords[18][1])
    
    bridges_gdf = gpd.GeoDataFrame({
        "id": ["bridge_syabru_01", "bridge_timure_02"],
        "name": ["Syabru Besi Suspension Bridge", "Bhote Koshi Crossing Bridge"],
        "bridge": ["yes", "yes"],
        "man_made": ["bridge", "bridge"],
        "geometry": [bridge1_pt, bridge2_pt]
    }, crs=crs)
    bridges_path = os.path.join(target_dir, "osm_bridges_pre_event.geojson")
    bridges_gdf.to_file(bridges_path, driver="GeoJSON")

    # 7. Pre-event OSM Settlements
    settlements_gdf = gpd.GeoDataFrame({
        "id": ["set_syabrubesi", "set_timure", "set_briddhim", "set_thuman", "set_khangjim", "set_lingling"],
        "name": ["Syabru Besi", "Timure", "Briddhim", "Thuman", "Khangjim", "Lingling"],
        "population": [1850, 1200, 420, 650, 310, 540],
        "place": ["town", "village", "village", "village", "isolated_dwelling", "village"],
        "geometry": [
            Point(hw_coords[12][0] + 0.002, hw_coords[12][1]),
            Point(hw_coords[25][0] + 0.001, hw_coords[25][1]),
            Point(85.330, 28.150),
            Point(85.385, 28.165),
            Point(85.328, 28.180),
            Point(hw_coords[12][0] - 0.015, hw_coords[12][1])
        ]
    }, crs=crs)
    settlements_path = os.path.join(target_dir, "osm_settlements_pre_event.geojson")
    settlements_gdf.to_file(settlements_path, driver="GeoJSON")

    # 8. Critical Facilities (Hospitals, Relief Hubs)
    facilities_gdf = gpd.GeoDataFrame({
        "id": ["fac_syabru_clinic", "fac_dhunche_hospital"],
        "name": ["Syabru Besi Primary Health Post", "Dhunche District Hospital Hub"],
        "amenity": ["clinic", "hospital"],
        "geometry": [
            Point(hw_coords[12][0] + 0.001, hw_coords[12][1] + 0.001),
            Point(hw_coords[2][0] + 0.002, hw_coords[2][1])
        ]
    }, crs=crs)
    facilities_path = os.path.join(target_dir, "osm_facilities_pre_event.geojson")
    facilities_gdf.to_file(facilities_path, driver="GeoJSON")

    # 9. Pre-event OSM Buildings (~120 buildings clustered around settlements)
    buildings = []
    bldg_ids = []
    for s_idx, s_row in settlements_gdf.iterrows():
        center = s_row.geometry
        num_bldgs = 25 if s_row["place"] == "town" else 15
        for b in range(num_bldgs):
            dx_m = np.random.uniform(-0.003, 0.003)
            dy_m = np.random.uniform(-0.003, 0.003)
            b_poly = box(
                center.x + dx_m - 0.00015,
                center.y + dy_m - 0.00015,
                center.x + dx_m + 0.00015,
                center.y + dy_m + 0.00015
            )
            buildings.append(b_poly)
            bldg_ids.append(f"bldg_{s_idx}_{b}")

    buildings_gdf = gpd.GeoDataFrame({
        "id": bldg_ids,
        "building": ["yes"] * len(buildings),
        "geometry": buildings
    }, crs=crs)
    buildings_path = os.path.join(target_dir, "osm_buildings_pre_event.geojson")
    buildings_gdf.to_file(buildings_path, driver="GeoJSON")

    return {
        "dem_path": dem_path,
        "pre_s1_path": pre_s1_path,
        "post_s1_path": post_s1_path,
        "roads_path": roads_path,
        "bridges_path": bridges_path,
        "settlements_path": settlements_path,
        "facilities_path": facilities_path,
        "buildings_path": buildings_path
    }

if __name__ == "__main__":
    generate_sample_study_dataset("c:/CS(AI) Enginering/Personal campus/Hackthon/Multimodel Ai Hackkthon/floodscope-ai/data/sample")
    print("Sample datasets successfully created!")
