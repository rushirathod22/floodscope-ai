"""
FloodScope AI - Satellite Service
Handles Sentinel-1 SAR acquisition validation, backscatter preprocessing,
Lee speckle filtering, and DEM slope / permanent water masking.
"""

import numpy as np
import scipy.ndimage as ndimage
from typing import Tuple, Dict, Any, Optional
from datetime import datetime
from rasterio.transform import Affine

def validate_sentinel1_pair(pre_meta: Dict[str, Any], post_meta: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """
    Validates hackathon constraints for Sentinel-1 flood analysis:
    1. Identical orbit pass (ASCENDING or DESCENDING)
    2. Identical relative orbit track number
    3. Proper temporal separation (exact multiples of 12 days for exact repeat geometry)
    """
    if pre_meta.get("orbit_pass") != post_meta.get("orbit_pass"):
        return False, f"Orbit pass mismatch: Pre-event is {pre_meta.get('orbit_pass')}, Post-event is {post_meta.get('orbit_pass')}. Both scenes must share the same pass."
    
    if pre_meta.get("relative_orbit") != post_meta.get("relative_orbit"):
        return False, f"Relative orbit mismatch: Pre-event is track #{pre_meta.get('relative_orbit')}, Post-event is track #{post_meta.get('relative_orbit')}. Both scenes must be acquired along the identical track."
        
    pre_date = pre_meta["date"] if isinstance(pre_meta["date"], datetime) else datetime.strptime(str(pre_meta["date"])[:10], "%Y-%m-%d")
    post_date = post_meta["date"] if isinstance(post_meta["date"], datetime) else datetime.strptime(str(post_meta["date"])[:10], "%Y-%m-%d")

    days_diff = abs((post_date - pre_date).days)
    if days_diff < 1:
        return False, "Pre-event and post-event dates cannot be identical."
        
    if days_diff % 12 != 0:
        return False, f"Temporal separation is {days_diff} days. Sentinel-1 repeat-pass SAR comparisons require multiples of 12 days (e.g. 12, 24, 36 days) to maintain identical incidence angles."

    return True, None

def lee_speckle_filter(img: np.ndarray, size: int = 5, nodata: Optional[float] = None) -> np.ndarray:
    """
    Enhanced Lee Filter for SAR speckle noise reduction.
    Preserves edges while smoothing uniform radar backscatter noise.
    Properly ignores nodata pixels.
    """
    valid_mask = np.isfinite(img)
    if nodata is not None:
        valid_mask &= (img != nodata)

    img_clean = np.where(valid_mask, img, 0.0)

    img_mean = ndimage.uniform_filter(img_clean, (size, size))
    img_sqr_mean = ndimage.uniform_filter(img_clean**2, (size, size))
    img_variance = np.maximum(img_sqr_mean - img_mean**2, 0)

    valid_vals = img[valid_mask]
    overall_variance = np.var(valid_vals) if len(valid_vals) > 0 else 1.0

    img_weights = img_variance / (img_variance + overall_variance + 1e-7)
    filtered = img_mean + img_weights * (img_clean - img_mean)
    
    # Re-apply nodata
    filtered[~valid_mask] = np.nan if nodata is None else nodata
    return filtered

def calculate_dem_slope(
    dem: np.ndarray, 
    transform: Optional[Affine] = None, 
    dem_nodata: float = -9999.0,
    crs: str = "EPSG:4326",
    fallback_cellsize_m: float = 30.0
) -> np.ndarray:
    """
    Calculates terrain slope in degrees from a DEM raster.
    Accurately converts geographic degree cells (EPSG:4326) to ground meters
    based on the scene's central latitude to avoid incorrect gradient calculations.
    """
    valid_mask = np.isfinite(dem) & (dem != dem_nodata) & (dem > -500.0)
    dem_work = np.where(valid_mask, dem, np.nan)

    if transform is not None and ("4326" in crs or transform.a < 1.0):
        # Coordinates are in degrees; convert to meters at the scene latitude
        deg_dx = abs(transform.a)
        deg_dy = abs(transform.e)
        center_lat = transform.f + (dem.shape[0] / 2.0) * transform.e
        
        # WGS84 ellipsoid conversion meters per degree
        dy_m = deg_dy * 111320.0
        dx_m = deg_dx * 111320.0 * np.cos(np.radians(center_lat))
        dx_m = max(dx_m, 1.0)
        dy_m = max(dy_m, 1.0)
    else:
        dx_m = fallback_cellsize_m
        dy_m = fallback_cellsize_m

    # Gradient computation with edge padding for NaNs
    dem_filled = np.nan_to_num(dem_work, nan=float(np.nanmedian(dem_work) if np.any(valid_mask) else 0.0))
    dy, dx = np.gradient(dem_filled, dy_m, dx_m)
    
    slope_rad = np.arctan(np.sqrt(dx**2 + dy**2))
    slope_deg = np.degrees(slope_rad)
    
    slope_deg[~valid_mask] = np.nan
    return slope_deg

def apply_masks(
    candidate_mask: np.ndarray, 
    dem: Optional[np.ndarray] = None, 
    permanent_water: Optional[np.ndarray] = None,
    slope_threshold_deg: float = 15.0,
    transform: Optional[Affine] = None,
    crs: str = "EPSG:4326",
    valid_data_mask: Optional[np.ndarray] = None
) -> np.ndarray:
    """
    Applies UN-SPIDER recommended exclusions:
    - Exclude permanent water bodies (e.g. GlobCover class 210, JRC water, or baseline river channels)
    - Exclude steep terrain (slope > slope_threshold_deg) to prevent false positives from radar shadows
    - Exclude invalid / nodata areas
    """
    filtered = candidate_mask.copy()
    
    if valid_data_mask is not None:
        filtered[~valid_data_mask] = 0

    if permanent_water is not None:
        # Exclude permanent water (1 = permanent water body)
        filtered[permanent_water > 0] = 0
        
    if dem is not None:
        slope = calculate_dem_slope(dem, transform=transform, crs=crs)
        # Exclude slopes greater than threshold or invalid DEM areas
        steep_or_invalid = (slope > slope_threshold_deg) | np.isnan(slope)
        filtered[steep_or_invalid] = 0
        
    return filtered
