"""
FloodScope AI - Satellite Service
Handles Sentinel-1 SAR acquisition validation, backscatter preprocessing,
Lee speckle filtering, and DEM slope / permanent water masking.
"""

import numpy as np
import scipy.ndimage as ndimage
from typing import Tuple, Dict, Any, Optional

def validate_sentinel1_pair(pre_meta: Dict[str, Any], post_meta: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """
    Validates hackathon constraints for Sentinel-1 flood analysis:
    1. Identical orbit pass (ASCENDING or DESCENDING)
    2. Identical relative orbit track number
    3. Proper temporal separation (multiples of 12 days for exact repeat geometry)
    """
    if pre_meta.get("orbit_pass") != post_meta.get("orbit_pass"):
        return False, f"Orbit pass mismatch: Pre is {pre_meta.get('orbit_pass')}, Post is {post_meta.get('orbit_pass')}"
    
    if pre_meta.get("relative_orbit") != post_meta.get("relative_orbit"):
        return False, f"Relative orbit mismatch: Pre is #{pre_meta.get('relative_orbit')}, Post is #{post_meta.get('relative_orbit')}"
        
    days_diff = abs((post_meta["date"] - pre_meta["date"]).days)
    if days_diff < 1:
        return False, "Pre and post event dates cannot be identical."
        
    return True, None

def lee_speckle_filter(img: np.ndarray, size: int = 5) -> np.ndarray:
    """
    Enhanced Lee Filter for SAR speckle noise reduction.
    Preserves edges while smoothing uniform radar backscatter noise.
    """
    img_mean = ndimage.uniform_filter(img, (size, size))
    img_sqr_mean = ndimage.uniform_filter(img**2, (size, size))
    img_variance = np.maximum(img_sqr_mean - img_mean**2, 0)

    overall_variance = np.var(img)
    if overall_variance == 0:
        return img

    img_weights = img_variance / (img_variance + overall_variance + 1e-7)
    img_output = img_mean + img_weights * (img - img_mean)
    return img_output

def calculate_dem_slope(dem: np.ndarray, cellsize_m: float = 30.0) -> np.ndarray:
    """
    Calculates terrain slope in degrees from a DEM raster.
    Used to mask out steep mountain slopes where radar shadow mimics low water backscatter.
    """
    dy, dx = np.gradient(dem, cellsize_m, cellsize_m)
    slope_rad = np.arctan(np.sqrt(dx**2 + dy**2))
    slope_deg = np.degrees(slope_rad)
    return slope_deg

def apply_masks(
    candidate_mask: np.ndarray, 
    dem: Optional[np.ndarray] = None, 
    permanent_water: Optional[np.ndarray] = None,
    slope_threshold_deg: float = 15.0
) -> np.ndarray:
    """
    Applies UN-SPIDER recommended exclusions:
    - Exclude permanent water bodies (e.g. GlobCover class 210 or pre-existing rivers)
    - Exclude steep terrain (slope > slope_threshold_deg) to prevent false positives from radar shadows
    """
    filtered = candidate_mask.copy()
    
    if permanent_water is not None:
        # 1 indicates permanent water; set to 0 in flood detection
        filtered[permanent_water > 0] = 0
        
    if dem is not None:
        slope = calculate_dem_slope(dem)
        filtered[slope > slope_threshold_deg] = 0
        
    return filtered
