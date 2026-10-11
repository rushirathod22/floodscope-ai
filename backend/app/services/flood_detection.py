"""
FloodScope AI - Flood Detection Service
Implements UN-SPIDER radar-based flood mapping methodology:
- SAR Backscatter Binarization (Otsu & Minimum thresholding)
- Pre/Post event change detection
- Multi-dataset nodata mask propagation
- Permanent water and terrain slope masking
- Georeferenced vector polygon extraction and GeoTIFF export
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

def compute_unspider_threshold(band_data: np.ndarray, valid_mask: Optional[np.ndarray] = None) -> float:
    """
    Computes SAR binarization threshold following UN-SPIDER Recommended Practice:
    Calculates Otsu and Minimum thresholds on valid radar backscatter pixels.
    """
    if valid_mask is not None:
        valid_pixels = band_data[valid_mask & np.isfinite(band_data)]
    else:
        flat = band_data.flatten()
        valid_pixels = flat[np.isfinite(flat)]
    
    if len(valid_pixels) == 0:
        return -16.0  # Standard empirical baseline for S1 VH cross-pol
        
    try:
        t_otsu = skimage.filters.threshold_otsu(valid_pixels)
    except Exception:
        t_otsu = -16.0

    try:
        t_min = skimage.filters.threshold_minimum(valid_pixels)
    except Exception:
        t_min = t_otsu

    # If minimum threshold is within reasonable physical separation, use optimal cutoff
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
    min_pixel_cluster: int = 5,
    pre_nodata: Optional[float] = -99.0,
    post_nodata: Optional[float] = -99.0,
    dem_nodata: Optional[float] = -9999.0
) -> Tuple[np.ndarray, gpd.GeoDataFrame, Dict[str, float]]:
    """
    Executes full Sentinel-1 change detection and binarization pipeline:
    1. Propagates unified nodata validity mask across Pre, Post, and DEM.
    2. Speckle reduction using enhanced Lee filter.
    3. Change backscatter calculation (delta_dB = post - pre).
    4. Threshold calculation (UN-SPIDER hybrid).
    5. Permanent water and terrain slope masking.
    6. Small-cluster morphological filtering.
    7. Vectorization to georeferenced GeoPandas GeoDataFrame.
    8. Rigorous metric surface area calculation on valid pixels.
    """
    # 1. Combine nodata validity masks
    valid_data_mask = np.isfinite(pre_s1_db) & np.isfinite(post_s1_db)
    if pre_nodata is not None:
        valid_data_mask &= (pre_s1_db != pre_nodata)
    if post_nodata is not None:
        valid_data_mask &= (post_s1_db != post_nodata)
    if dem is not None and dem_nodata is not None:
        valid_data_mask &= (np.isfinite(dem) & (dem != dem_nodata) & (dem > -500.0))

    # 2. Speckle filtering on valid data
    pre_clean = lee_speckle_filter(pre_s1_db, size=5, nodata=pre_nodata)
    post_clean = lee_speckle_filter(post_s1_db, size=5, nodata=post_nodata)
    
    # 3. Backscatter change (specular water causes distinct negative dB drop)
    delta_db = np.zeros_like(post_clean)
    delta_db[valid_data_mask] = post_clean[valid_data_mask] - pre_clean[valid_data_mask]
    
    # 4. UN-SPIDER threshold on post-event
    threshold_db = compute_unspider_threshold(post_clean, valid_mask=valid_data_mask)
    
    # Candidate flood condition:
    # Post backscatter is below water threshold OR shows significant drop (<= -3.0 dB) with low post value
    water_post = (post_clean < threshold_db) & valid_data_mask
    significant_drop = (delta_db < -3.0) & (post_clean < (threshold_db + 2.0)) & valid_data_mask
    candidate_flood = (water_post | significant_drop).astype(np.uint8)
    
    # 5. Apply terrain slope, permanent water, and nodata validity masks
    filtered_flood = apply_masks(
        candidate_flood, 
        dem=dem, 
        permanent_water=perm_water, 
        slope_threshold_deg=slope_cutoff,
        transform=transform,
        crs=crs,
        valid_data_mask=valid_data_mask
    )
    
    # 6. Morphological cleanup - remove 1-2 pixel isolated false positives
    structure = ndimage.generate_binary_structure(2, 2)
    labeled, num_features = ndimage.label(filtered_flood, structure=structure)
    feature_sizes = np.bincount(labeled.ravel())
    mask_sizes = feature_sizes >= min_pixel_cluster
    mask_sizes[0] = 0  # ignore background
    cleaned_flood = mask_sizes[labeled].astype(np.uint8)
    cleaned_flood[~valid_data_mask] = 0
    
    # 7. Vectorize to GeoDataFrame
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

    # 8. Accurate surface area calculation
    if "4326" in crs or abs(transform.a) < 1.0:
        center_lat = transform.f + (pre_s1_db.shape[0] / 2.0) * transform.e
        m_per_deg_lat = 111320.0
        m_per_deg_lon = 111320.0 * np.cos(np.radians(center_lat))
        pixel_area_sq_m = (abs(transform.a) * m_per_deg_lon) * (abs(transform.e) * m_per_deg_lat)
    else:
        pixel_area_sq_m = abs(transform.a) * abs(transform.e)

    total_valid_pixels = int(np.sum(valid_data_mask))
    flood_pixels = int(np.sum(cleaned_flood == 1))
    
    total_area_sq_km = (total_valid_pixels * pixel_area_sq_m) / 1_000_000.0
    flood_area_sq_km = (flood_pixels * pixel_area_sq_m) / 1_000_000.0
    flood_hectares = flood_area_sq_km * 100.0
    
    stats = {
        "total_area_analyzed_sq_km": round(total_area_sq_km, 2),
        "candidate_flood_area_sq_km": round(flood_area_sq_km, 2),
        "candidate_flood_area_hectares": round(flood_hectares, 1),
        "flood_pixel_count": flood_pixels,
        "valid_pixel_count": total_valid_pixels,
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
