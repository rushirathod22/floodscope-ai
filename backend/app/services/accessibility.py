"""
FloodScope AI - Accessibility Analysis Service
Uses NetworkX to build a road network graph, calculate connectivity between settlements
and critical hub facilities (hospitals/town centers), and determine isolated/disconnected communities
under candidate road disruption assumptions.
"""

import networkx as nx
import geopandas as gpd
from shapely.geometry import Point, LineString
from typing import Dict, Any, List, Tuple
import os

def build_road_graph(roads_gdf: gpd.GeoDataFrame) -> Tuple[nx.Graph, Dict[str, Tuple[float, float]]]:
    """
    Constructs a NetworkX graph from a GeoDataFrame of road LineStrings:
    - Endpoints / intersections of road segments become graph nodes.
    - Road segments become weighted edges (length in meters).
    """
    G = nx.Graph()
    node_coords = {}
    
    # Ensure metric coordinates for accurate Euclidean weights
    roads_metric = roads_gdf.to_crs("EPSG:32645") if roads_gdf.crs != "EPSG:32645" else roads_gdf

    for idx, row in roads_metric.iterrows():
        geom = row.geometry
        if geom is None or geom.is_empty:
            continue
            
        # If MultiLineString, extract lines
        lines = geom.geoms if hasattr(geom, "geoms") else [geom]
        for line in lines:
            coords = list(line.coords)
            if len(coords) < 2:
                continue
                
            u_coord = (round(coords[0][0], 1), round(coords[0][1], 1))
            v_coord = (round(coords[-1][0], 1), round(coords[-1][1], 1))
            
            u_id = f"node_{u_coord[0]}_{u_coord[1]}"
            v_id = f"node_{v_coord[0]}_{v_coord[1]}"
            
            node_coords[u_id] = u_coord
            node_coords[v_id] = v_coord
            
            edge_length_m = line.length
            road_id = row.get("id", f"road_{idx}")
            is_disrupted = row.get("status") == "potentially_affected"
            
            G.add_edge(
                u_id, 
                v_id, 
                weight=edge_length_m, 
                road_id=road_id,
                disrupted=is_disrupted,
                geometry=line
            )
            
    return G, node_coords

def find_nearest_graph_node(point_metric: Point, node_coords: Dict[str, Tuple[float, float]]) -> Tuple[str, float]:
    """
    Finds the closest node on the road graph for a given POI (settlement or hospital).
    """
    best_node = None
    min_dist = float("inf")
    px, py = point_metric.x, point_metric.y
    
    for node_id, (nx_x, ny_y) in node_coords.items():
        dist = ((px - nx_x)**2 + (py - ny_y)**2)**0.5
        if dist < min_dist:
            min_dist = dist
            best_node = node_id
            
    return best_node, min_dist

def analyze_accessibility(
    roads_gdf: gpd.GeoDataFrame,
    settlements_gdf: gpd.GeoDataFrame,
    facilities_gdf: gpd.GeoDataFrame  # Hospitals, emergency coordination centers, key towns
) -> Tuple[gpd.GeoDataFrame, Dict[str, Any]]:
    """
    Simulates pre-event vs post-event connectivity:
    1. Builds full pre-event road network graph.
    2. Builds post-event graph by removing candidate disrupted edges (flooded road segments).
    3. Evaluates shortest path reachability to the nearest critical facility.
    4. Labels settlements as accessible or candidate_disconnected.
    """
    if roads_gdf.empty or settlements_gdf.empty:
        return settlements_gdf, {
            "total_settlements": len(settlements_gdf),
            "disconnected_settlements_count": 0,
            "accessible_settlements_count": len(settlements_gdf),
            "disconnected_details": [],
            "disrupted_edge_count": 0,
            "methodology": "No network data available."
        }

    # Step 1: Build full graph
    G_pre, node_coords = build_road_graph(roads_gdf)
    
    # Step 2: Build post-event graph by filtering out disrupted edges
    G_post = G_pre.copy()
    disrupted_edges = [
        (u, v) for u, v, data in G_post.edges(data=True) if data.get("disrupted", False)
    ]
    G_post.remove_edges_from(disrupted_edges)

    # Convert POIs to metric CRS
    settlements_metric = settlements_gdf.to_crs("EPSG:32645")
    facilities_metric = facilities_gdf.to_crs("EPSG:32645")

    # Map facilities to nearest graph nodes
    facility_nodes = {}
    for idx, row in facilities_metric.iterrows():
        node, _ = find_nearest_graph_node(row.geometry, node_coords)
        if node:
            facility_nodes[row.get("name", f"Facility_{idx}")] = node

    results = []
    settlement_details = []
    
    for idx, row in settlements_metric.iterrows():
        settlement_name = row.get("name", f"Settlement_{idx}")
        pop_est = int(row.get("population", 500))
        st_node, _ = find_nearest_graph_node(row.geometry, node_coords)
        
        # Pre-event reachability
        pre_reachable = False
        min_pre_dist = float("inf")
        nearest_fac_name = "None"
        
        for fac_name, fac_node in facility_nodes.items():
            if nx.has_path(G_pre, st_node, fac_node):
                pre_reachable = True
                path_len = nx.shortest_path_length(G_pre, st_node, fac_node, weight="weight")
                if path_len < min_pre_dist:
                    min_pre_dist = path_len
                    nearest_fac_name = fac_name
                    
        # Post-event reachability (with candidate disrupted links removed)
        post_reachable = False
        min_post_dist = float("inf")
        if pre_reachable:
            for fac_name, fac_node in facility_nodes.items():
                if nx.has_path(G_post, st_node, fac_node):
                    post_reachable = True
                    path_len = nx.shortest_path_length(G_post, st_node, fac_node, weight="weight")
                    if path_len < min_post_dist:
                        min_post_dist = path_len

        # Candidate disconnected if reachable before, but unreachable after disruption
        is_isolated = pre_reachable and not post_reachable
        
        status_label = "candidate_disconnected" if is_isolated else ("accessible" if post_reachable else "unreachable_prior")
        
        settlement_details.append({
            "id": f"settlement_{idx}",
            "name": settlement_name,
            "population_est": pop_est,
            "isolated": is_isolated,
            "nearest_hospital": nearest_fac_name,
            "distance_km": round(min_pre_dist / 1000.0, 2) if min_pre_dist < float("inf") else -1.0,
            "pre_event_travel_possible": pre_reachable,
            "post_event_travel_possible": post_reachable,
            "status": status_label
        })

    # Prepare output GeoDataFrame
    results_gdf = settlements_gdf.copy()
    results_gdf["accessibility_status"] = [d["status"] for d in settlement_details]
    results_gdf["is_isolated"] = [d["isolated"] for d in settlement_details]
    results_gdf["nearest_facility"] = [d["nearest_hospital"] for d in settlement_details]
    results_gdf["pre_distance_km"] = [d["distance_km"] for d in settlement_details]

    disconnected_count = sum(1 for d in settlement_details if d["isolated"])
    accessible_count = sum(1 for d in settlement_details if d["post_event_travel_possible"])

    stats = {
        "total_settlements": len(settlement_details),
        "disconnected_settlements_count": disconnected_count,
        "accessible_settlements_count": accessible_count,
        "disconnected_details": settlement_details,
        "disrupted_edge_count": len(disrupted_edges),
        "methodology": (
            "NetworkX shortest-path graph connectivity from settlement centroids to nearest emergency "
            "facilities/town centers. Candidate road segments intersecting flood extent are removed as edge disruptions."
        )
    }

    return results_gdf, stats

def export_accessibility_geojson(accessibility_gdf: gpd.GeoDataFrame, out_path: str):
    """
    Exports accessibility analysis results as GeoJSON.
    """
    accessibility_gdf.to_file(out_path, driver="GeoJSON")
