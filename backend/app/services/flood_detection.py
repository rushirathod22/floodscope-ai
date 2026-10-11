"""
FloodScope AI - Flood Detection Service
Implements UN-SPIDER radar-based flood mapping methodology:
- SAR Backscatter Binarization (Otsu & Minimum thresholding)
- Pre/Post event change detection
- Morphological noise removal
- Vector polygon extraction and GeoTIFF georeferencing
"""

import numpy as np
import skimage.filters
import scipy.ndimage as ndimage
import rasterio
from rasterio.features import shapes
from rasterio.transform import Affine
from shapely.geometry import shape, mapping
from shapely.ops import unary_union
import geopandas as gpd
from typing import Dict, Any, Tuple, Optional
import json

from .satellite import lee_speckle_filter, apply_masks

def compute_unspider_threshold(band_data: np.ndarray) -> float:
    """
    Computes SAR binarization threshold following UN-SPIDER Recommended Practice:
    Calculates Otsu and Minimum thresholds, selecting the optimal cutoff
    to separate specular water reflections from rough ground surfaces.
    """
    flat = band_data.flatten()
    valid_pixels = flat[np.isfinite(flat)]
    
    if len(valid_pixels) == 0:
        return -16.0  # Default standard empirical threshold for S1 VH
        
    try:
        t_otsu = skimage.filters.threshold_otsu(valid_pixels)
    except Exception:
        t_otsu = -16.0

    try:
        t_min = skimage.filters.threshold_minimum(valid_pixels)
    except Exception:
        t_min = t_otsu

    # If minimum threshold is valid and has sufficient separation, use hybrid check
    if np.isfinite(t_min) and abs(t_min - t_otsu) < 8.0:
        return float(min(t_otsu, t_min))
    return float(t_otsu)

def detect_flood_extent(
    pre_s1_db: np.ndarray,
    post_s1_db: np.ndarray,
    transform: Affine,
    crs: str = "EPSG:4326",
    dem: Optional[np.ndarray] = None,
    perm_water: Optional[np.ndarray] = None,
    slope_cutoff: float = 15.0,
    min_pixel_cluster: int = 5
) -> Tuple[np.ndarray, gpd.GeoDataFrame, Dict[str, float]]:
    """
    Executes full Sentinel-1 change detection and binarization pipeline:
    1. Speckle reduction using Lee filter
    2. Change backscatter calculation (delta_dB = post - pre)
    3. Threshold calculation
    4. Permanent water and terrain slope masking
    5. Small-cluster morphological filtering
    6. Vectorization to georeferenced GeoPandas GeoDataFrame
    """
    # 1. Speckle filtering
    pre_clean = lee_speckle_filter(pre_s1_db, size=5)
    post_clean = lee_speckle_filter(post_s1_db, size=5)
    
    # 2. Backscatter change (water causes significant specular drop)
    delta_db = post_clean - pre_clean
    
    # 3. UN-SPIDER threshold on post-event
    threshold_db = compute_unspider_threshold(post_clean)
    
    # Candidate flood:
    # Post backscatter is below water threshold OR shows significant drop (e.g. <= -3.0 dB) with low post value
    water_post = post_clean < threshold_db
    significant_drop = (delta_db < -3.0) & (post_clean < (threshold_db + 2.0))
    candidate_flood = (water_post | significant_drop).astype(np.uint8)
    
    # 4. Apply terrain slope and permanent water masks
    filtered_flood = apply_masks(
        candidate_flood, 
        dem=dem, 
        permanent_water=perm_water, 
        slope_threshold_deg=slope_cutoff
    )
    
    # 5. Morphological cleanup - remove 1-2 pixel isolated false positives
    structure = ndimage.generate_binary_structure(2, 2)
    labeled, num_features = ndimage.label(filtered_flood, structure=structure)
    feature_sizes = np.bincount(labeled.ravel())
    mask_sizes = feature_sizes >= min_pixel_cluster
    mask_sizes[0] = 0  # ignore background
    cleaned_flood = mask_sizes[labeled].astype(np.uint8)
    
    # 6. Vectorize to GeoDataFrame
    shapes_gen = shapes(cleaned_flood, mask=(cleaned_flood == 1), transform=transform)
    geometries = []
    
    for geom_dict, val in shapes_gen:
        if val == 1:
            poly = shape(geom_dict)
            if poly.is_valid and poly.area > 0:
                geometries.append(poly)
                
    if geometries:
        # Union overlapping/adjacent polygons
        dissolved = unary_union(geometries)
        if dissolved.geom_type == 'MultiPolygon':
            polys = list(dissolved.geoms)
        elif dissolved.geom_type == 'Polygon':
            polys = [dissolved]
        else:
            polys = []
            
        gdf = gpd.GeoDataFrame({
            "geometry": polys,
            "classification": ["candidate_flood_extent"] * len(polys),
            "confidence": ["high"] * len(polys),
            "detection_method": ["unspider_sentinel1_sar"] * len(polys)
        }, crs=crs)
    else:
        gdf = gpd.GeoDataFrame(columns=["geometry", "classification", "confidence", "detection_method"], crs=crs)

    # Calculate statistics
    pixel_width = abs(transform.a)
    pixel_height = abs(transform.e)
    # Approx pixel area in meters (or degrees to meters if 4326, at ~28 deg lat 1 deg lat ~ 111km, 1 deg lon ~ 98km)
    if crs == "EPSG:4326":
        # Rough meters per degree around Nepal latitude 28°N
        m_per_deg_lat = 111000.0
        m_per_deg_lon = 98000.0
        pixel_area_sq_m = (pixel_width * m_per_deg_lon) * (pixel_height * m_per_deg_lat)
    else:
        pixel_area_sq_m = pixel_width * pixel_height

    total_pixels = cleaned_flood.size
    flood_pixels = int(np.sum(cleaned_flood))
    
    total_area_sq_km = (total_pixels * pixel_area_sq_m) / 1_000_000.0
    flood_area_sq_km = (flood_pixels * pixel_area_sq_m) / 1_000_000.0
    flood_hectares = flood_area_sq_km * 100.0
    
    stats = {
        "total_area_analyzed_sq_km": round(total_area_sq_km, 2),
        "candidate_flood_area_sq_km": round(flood_area_sq_km, 2),
        "candidate_flood_area_hectares": round(flood_hectares, 1),
        "flood_pixel_count": flood_pixels,
        "binarization_threshold_db": round(threshold_db, 2)
    }
    
    return cleaned_flood, gdf, stats

def export_flood_geotiff(
    raster: np.ndarray,
    transform: Affine,
    out_path: str,
    crs: str = "EPSG:4326"
):
    """
    Exports georeferenced flood classification raster as a standard Cloud-Optimized GeoTIFF.
    """
    height, width = raster.shape
    with rasterio.open(
        out_path,
        'w',
        driver='GTiff',
        height=height,
        width=width,
        count=1,
        dtype=raster.dtype,
        crs=crs,
        transform=transform,
        nodata=0,
        compress='lzw'
    ) as dst:
        dst.write(raster, 1)

def export_flood_geojson(gdf: gpd.GeoDataFrame, out_path: str):
    """
    Exports candidate flood vector polygons as GeoJSON.
    """
    gdf.to_file(out_path, driver="GeoJSON")
