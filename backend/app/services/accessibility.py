"""
FloodScope AI - Accessibility Analysis Service
Uses NetworkX to build a topological road network graph from all baseline roads,
detects candidate disruptions from flood polygon intersections, and computes
exact shortest-path reachability from settlements to emergency clinics and hospitals.
"""

import networkx as nx
import geopandas as gpd
from shapely.geometry import Point, LineString
from shapely.ops import unary_union, linemerge
from typing import Dict, Any, List, Tuple
import os

def build_topological_road_network(
    all_roads_gdf: gpd.GeoDataFrame,
    flood_gdf: gpd.GeoDataFrame,
    metric_crs: str = "EPSG:32645"
) -> Tuple[nx.Graph, nx.Graph, Dict[str, Tuple[float, float]], int]:
    """
    Constructs a true topological NetworkX graph from the FULL baseline road network:
    1. Converts all roads to metric CRS (UTM EPSG:32645) for true Euclidean distance weights.
    2. Segments each road LineString between consecutive vertices so junctions and forks
       naturally connect at shared coordinate nodes.
    3. Identifies candidate disrupted segments where a segment intersects the candidate flood extent.
    4. Generates:
       - G_pre: Full pre-event road network.
       - G_post: Post-event network with candidate disrupted road edges removed.
    """
    roads_metric = all_roads_gdf.to_crs(metric_crs) if all_roads_gdf.crs != metric_crs else all_roads_gdf
    
    flood_union = None
    if flood_gdf is not None and not flood_gdf.empty:
        flood_metric = flood_gdf.to_crs(metric_crs) if flood_gdf.crs != metric_crs else flood_gdf
        flood_union = flood_metric.union_all() if hasattr(flood_metric, "union_all") else flood_metric.unary_union

    G_pre = nx.Graph()
    node_coords = {}
    disrupted_edge_count = 0

    for idx, row in roads_metric.iterrows():
        geom = row.geometry
        if geom is None or geom.is_empty:
            continue
            
        lines = geom.geoms if hasattr(geom, "geoms") else [geom]
        for line in lines:
            coords = list(line.coords)
            if len(coords) < 2:
                continue
                
            # Iterate through consecutive vertices to ensure intermediate junctions connect
            for i in range(len(coords) - 1):
                p1 = coords[i]
                p2 = coords[i + 1]
                
                u_coord = (round(p1[0], 1), round(p1[1], 1))
                v_coord = (round(p2[0], 1), round(p2[1], 1))
                
                u_id = f"node_{u_coord[0]}_{u_coord[1]}"
                v_id = f"node_{v_coord[0]}_{v_coord[1]}"
                
                node_coords[u_id] = u_coord
                node_coords[v_id] = v_coord
                
                segment = LineString([p1, p2])
                seg_length_m = segment.length
                
                # Check if segment intersects candidate flood extent
                is_disrupted = False
                if flood_union is not None and segment.intersects(flood_union):
                    is_disrupted = True
                    disrupted_edge_count += 1
                    
                G_pre.add_edge(
                    u_id,
                    v_id,
                    weight=seg_length_m,
                    road_id=row.get("id", f"road_{idx}"),
                    disrupted=is_disrupted
                )

    # Post-event graph with candidate disrupted segments removed
    G_post = G_pre.copy()
    disrupted_edges = [
        (u, v) for u, v, data in G_post.edges(data=True) if data.get("disrupted", False)
    ]
    G_post.remove_edges_from(disrupted_edges)

    return G_pre, G_post, node_coords, len(disrupted_edges)

def find_nearest_graph_node(point_metric: Point, node_coords: Dict[str, Tuple[float, float]]) -> Tuple[str, float]:
    """
    Finds the closest node on the road graph for a given POI (settlement centroid or hospital).
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
    all_roads_gdf: gpd.GeoDataFrame,
    flood_gdf: gpd.GeoDataFrame,
    settlements_gdf: gpd.GeoDataFrame,
    facilities_gdf: gpd.GeoDataFrame,
    metric_crs: str = "EPSG:32645"
) -> Tuple[gpd.GeoDataFrame, Dict[str, Any]]:
    """
    Calculates pre-event vs post-event network reachability:
    1. Builds full pre-event graph G_pre from ALL baseline roads.
    2. Builds post-event graph G_post with flooded edges severed.
    3. Checks whether each settlement can reach at least one emergency medical/hub facility.
    4. Categorizes settlements as:
       - 'accessible': Connected in post-event scenario.
       - 'candidate_disconnected': Connected prior to event, but severed by flood.
       - 'unreachable_prior': Isolated even before flood in baseline data.
    """
    if all_roads_gdf.empty or settlements_gdf.empty:
        return settlements_gdf, {
            "total_settlements": len(settlements_gdf),
            "disconnected_settlements_count": 0,
            "accessible_settlements_count": len(settlements_gdf),
            "disconnected_details": [],
            "disrupted_edge_count": 0,
            "methodology": "No network baseline data available."
        }

    # Step 1 & 2: Build topological graphs from all baseline roads
    G_pre, G_post, node_coords, disrupted_edge_count = build_topological_road_network(
        all_roads_gdf=all_roads_gdf,
        flood_gdf=flood_gdf,
        metric_crs=metric_crs
    )

    # Convert POIs to metric CRS
    settlements_metric = settlements_gdf.to_crs(metric_crs) if settlements_gdf.crs != metric_crs else settlements_gdf
    facilities_metric = facilities_gdf.to_crs(metric_crs) if facilities_gdf.crs != metric_crs else facilities_gdf

    # Map facilities to nearest graph nodes
    facility_nodes = {}
    for idx, row in facilities_metric.iterrows():
        node, _ = find_nearest_graph_node(row.geometry, node_coords)
        if node:
            facility_nodes[row.get("name", f"Facility_{idx}")] = node

    settlement_details = []
    
    for idx, row in settlements_metric.iterrows():
        settlement_name = row.get("name", f"Settlement_{idx}")
        pop_est = int(row.get("population", 500))
        st_node, _ = find_nearest_graph_node(row.geometry, node_coords)
        
        # Pre-event reachability
        pre_reachable = False
        min_pre_dist = float("inf")
        nearest_fac_name = "None"
        
        if st_node in G_pre:
            for fac_name, fac_node in facility_nodes.items():
                if fac_node in G_pre and nx.has_path(G_pre, st_node, fac_node):
                    pre_reachable = True
                    path_len = nx.shortest_path_length(G_pre, st_node, fac_node, weight="weight")
                    if path_len < min_pre_dist:
                        min_pre_dist = path_len
                        nearest_fac_name = fac_name
                        
        # Post-event reachability (with flooded road links removed)
        post_reachable = False
        min_post_dist = float("inf")
        if pre_reachable and st_node in G_post:
            for fac_name, fac_node in facility_nodes.items():
                if fac_node in G_post and nx.has_path(G_post, st_node, fac_node):
                    post_reachable = True
                    path_len = nx.shortest_path_length(G_post, st_node, fac_node, weight="weight")
                    if path_len < min_post_dist:
                        min_post_dist = path_len

        # Candidate disconnected condition
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
        "disrupted_edge_count": disrupted_edge_count,
        "methodology": (
            "NetworkX topological graph model built from full baseline road network. "
            "Candidate road segments intersecting detected flood extent removed as edge disruptions. "
            "Reachability measured to nearest emergency facility before vs. after candidate disruption."
        )
    }

    return results_gdf, stats

def export_accessibility_geojson(accessibility_gdf: gpd.GeoDataFrame, out_path: str):
    """
    Exports accessibility analysis results as GeoJSON.
    """
    accessibility_gdf.to_file(out_path, driver="GeoJSON")
