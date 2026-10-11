"""
FloodScope AI - Pipeline Integration Test
Verifies Step 1 through Step 5 of the system:
1. Sentinel-1 SAR change detection and flood masking
2. GeoTIFF and GeoJSON georeferenced layer export
3. Infrastructure intersection (buildings, roads, bridges)
4. NetworkX graph road accessibility and disconnected settlements
5. Grounded situation report generation in English and Nepali
"""

import os
import rasterio
import geopandas as gpd
from datetime import datetime
from backend.app.services.satellite import validate_sentinel1_pair
from backend.app.services.flood_detection import detect_flood_extent, export_flood_geotiff, export_flood_geojson
from backend.app.services.infrastructure import analyze_infrastructure, export_infrastructure_geojson
from backend.app.services.accessibility import analyze_accessibility, export_accessibility_geojson
from backend.app.services.reports import generate_situation_report

def test_full_pipeline():
    sample_dir = os.path.join(os.path.dirname(__file__), "..", "data", "sample")
    output_dir = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
    os.makedirs(output_dir, exist_ok=True)

    # 1. Test Orbit Validation
    pre_meta = {"orbit_pass": "DESCENDING", "relative_orbit": 121, "date": datetime(2024, 8, 14)}
    post_meta = {"orbit_pass": "DESCENDING", "relative_orbit": 121, "date": datetime(2024, 8, 26)}
    valid, err = validate_sentinel1_pair(pre_meta, post_meta)
    assert valid is True, f"Metadata validation failed: {err}"

    # 2. Test Sentinel-1 Flood Detection
    pre_path = os.path.join(sample_dir, "s1_pre_20240814_vh.tif")
    post_path = os.path.join(sample_dir, "s1_post_20240826_vh.tif")
    dem_path = os.path.join(sample_dir, "copernicus_dem_rasuwa.tif")

    with rasterio.open(pre_path) as src_pre, rasterio.open(post_path) as src_post, rasterio.open(dem_path) as src_dem:
        pre_data = src_pre.read(1)
        post_data = src_post.read(1)
        dem_data = src_dem.read(1)
        transform = src_post.transform
        crs = src_post.crs.to_string() if src_post.crs else "EPSG:4326"

    cleaned_flood, flood_gdf, flood_stats = detect_flood_extent(
        pre_s1_db=pre_data,
        post_s1_db=post_data,
        transform=transform,
        crs=crs,
        dem=dem_data,
        slope_cutoff=15.0
    )

    assert flood_stats["flood_pixel_count"] > 0, "No flood pixels detected"
    assert flood_stats["candidate_flood_area_sq_km"] > 0, "Candidate flood area must be > 0"

    # Export georeferenced raster and vector layers
    geotiff_out = os.path.join(output_dir, "flood_extent.tif")
    geojson_out = os.path.join(output_dir, "flood_extent.geojson")
    export_flood_geotiff(cleaned_flood, transform, geotiff_out, crs=crs)
    export_flood_geojson(flood_gdf, geojson_out)

    assert os.path.exists(geotiff_out), "Exported GeoTIFF file does not exist"
    assert os.path.exists(geojson_out), "Exported GeoJSON file does not exist"

    # 3. Test Infrastructure Analysis
    buildings_gdf = gpd.read_file(os.path.join(sample_dir, "osm_buildings_pre_event.geojson"))
    roads_gdf = gpd.read_file(os.path.join(sample_dir, "osm_roads_pre_event.geojson"))
    bridges_gdf = gpd.read_file(os.path.join(sample_dir, "osm_bridges_pre_event.geojson"))

    aff_bldgs, aff_roads, aff_bridges, infra_stats = analyze_infrastructure(
        flood_gdf=flood_gdf,
        osm_buildings_gdf=buildings_gdf,
        osm_roads_gdf=roads_gdf,
        osm_bridges_gdf=bridges_gdf
    )

    export_infrastructure_geojson(aff_bldgs, aff_roads, aff_bridges, output_dir)
    assert infra_stats["total_buildings"] > 0
    assert "spatial_rule_applied" in infra_stats

    # 4. Test Accessibility Analysis
    settlements_gdf = gpd.read_file(os.path.join(sample_dir, "osm_settlements_pre_event.geojson"))
    facilities_gdf = gpd.read_file(os.path.join(sample_dir, "osm_facilities_pre_event.geojson"))

    access_gdf, access_stats = analyze_accessibility(
        roads_gdf=aff_roads,
        settlements_gdf=settlements_gdf,
        facilities_gdf=facilities_gdf
    )

    access_out = os.path.join(output_dir, "accessibility_results.geojson")
    export_accessibility_geojson(access_gdf, access_out)
    assert os.path.exists(access_out)
    assert access_stats["total_settlements"] == len(settlements_gdf)

    # 5. Test Situation Report Generation (English & Nepali)
    metrics_bundle = {
        "analysis_id": "test_run_01",
        "area_name": "Nepal Rasuwa District (Trishuli Basin)",
        "summary": flood_stats,
        "infrastructure": infra_stats,
        "accessibility": access_stats
    }

    report_en = generate_situation_report(metrics_bundle, language="en")
    assert "Emergency Flood Situation Report" in report_en["content_markdown"]
    assert str(flood_stats["candidate_flood_area_sq_km"]) in report_en["content_markdown"]

    report_ne = generate_situation_report(metrics_bundle, language="ne")
    assert "बाढी अवस्था तथा उद्धार जाहेरी प्रतिवेदन" in report_ne["content_markdown"]

    print("ALL 5 MILESTONES TESTED SUCCESSFULLY!")
    print(f"Candidate Flood Area: {flood_stats['candidate_flood_area_sq_km']} sq km ({flood_stats['candidate_flood_area_hectares']} ha)")
    print(f"Potentially Affected Buildings: {infra_stats['potentially_affected_buildings']}")
    print(f"Potentially Affected Roads: {infra_stats['potentially_affected_road_km']} km")
    print(f"Potentially Affected Bridges: {infra_stats['potentially_affected_bridges']}")
    print(f"Disconnected Settlements: {access_stats['disconnected_settlements_count']}")

if __name__ == "__main__":
    test_full_pipeline()
