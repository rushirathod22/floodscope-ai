export interface AnalysisRequest {
  area_id: string;
  pre_event_date: string;
  post_event_date: string;
  orbit_pass: string;
  relative_orbit: number;
  polarization: string;
  threshold_method: string;
  dem_slope_cutoff_deg: number;
}

export interface FloodExtentSummary {
  total_area_analyzed_sq_km: number;
  candidate_flood_area_sq_km: number;
  candidate_flood_area_hectares: number;
  sensor: string;
  pre_event_scene: string;
  post_event_scene: string;
  orbit_track: number;
  permanent_water_masked: boolean;
  steep_slopes_masked: boolean;
  data_source_mode?: string;
}

export interface InfrastructureStats {
  total_buildings: number;
  potentially_affected_buildings: number;
  total_road_length_km: number;
  potentially_affected_road_km: number;
  total_bridges: number;
  potentially_affected_bridges: number;
  spatial_rule_applied: string;
}

export interface DisconnectedSettlement {
  id: string;
  name: string;
  population_est: number;
  isolated: boolean;
  nearest_hospital: string;
  distance_km: number;
  pre_event_travel_possible: boolean;
  post_event_travel_possible: boolean;
  status: string;
}

export interface AccessibilityResults {
  total_settlements: number;
  disconnected_settlements_count: number;
  accessible_settlements_count: number;
  disconnected_details: DisconnectedSettlement[];
  disrupted_edge_count: number;
  methodology: string;
}

export interface AnalysisStatus {
  analysis_id: string;
  status: string;
  created_at: string;
  completed_at?: string;
  area_name: string;
  data_source_mode?: string;
  summary: FloodExtentSummary;
  infrastructure: InfrastructureStats;
  accessibility: AccessibilityResults;
}

export interface MapLayersResponse {
  analysis_id: string;
  bounds: [[number, number], [number, number]];
  layers: {
    flood_extent: any;
    buildings: any;
    roads: any;
    bridges: any;
    settlements: any;
    facilities: any;
  };
}

export interface ReportResponse {
  report_id: string;
  analysis_id: string;
  language: string;
  title: string;
  generated_at: string;
  content_markdown: string;
  structured_metrics: any;
  uncertainties_and_limitations: string[];
  citations: string[];
}

export interface TracePathResult {
  start_point: { lat: number; lon: number; elevation_m: number };
  end_point: { lat: number; lon: number; elevation_m: number };
  total_path_length_km: number;
  total_vertical_drop_m: number;
  flow_path_geojson: any;
  elevation_profile: Array<{ step: number; distance_km: number; elevation_m: number; lat: number; lon: number }>;
  settlements_at_risk: Array<{
    id: string;
    name: string;
    population: number;
    distance_downstream_km: number;
    est_arrival_minutes: number;
    risk_level: string;
    lat: number;
    lon: number;
  }>;
}

export interface EMSR927ValidationResult {
  activation_id: string;
  event_title: string;
  reference_source: string;
  detected_area_ha: number;
  emsr927_reference_ha: number;
  intersection_ha: number;
  false_positive_ha: number;
  false_negative_ha: number;
  metrics: {
    iou_jaccard: number;
    precision: number;
    recall: number;
    f1_score: number;
  };
  scientific_notes: string[];
  attribution: string;
  comparison_geojson: any;
}

export interface CopilotChatResponse {
  question: string;
  language: string;
  answer: string;
  grounded_metrics: any;
  recommended_actions: string[];
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async runAnalysis(params: Partial<AnalysisRequest>): Promise<AnalysisStatus> {
    const res = await fetch(`${API_BASE}/analysis/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        area_id: params.area_id || 'nepal_rasuwa',
        pre_event_date: params.pre_event_date || '2024-08-14',
        post_event_date: params.post_event_date || '2024-08-26',
        orbit_pass: params.orbit_pass || 'DESCENDING',
        relative_orbit: params.relative_orbit || 121,
        polarization: params.polarization || 'VH',
        threshold_method: params.threshold_method || 'otsu_minimum_hybrid',
        dem_slope_cutoff_deg: params.dem_slope_cutoff_deg ?? 15.0,
      }),
    });
    if (!res.ok) throw new Error('Failed to run analysis');
    return res.json();
  },

  async getAnalysis(id: string = 'latest'): Promise<AnalysisStatus> {
    const res = await fetch(`${API_BASE}/analysis/${id}`);
    if (!res.ok) throw new Error('Failed to fetch analysis status');
    return res.json();
  },

  async getMapLayers(id: string = 'latest'): Promise<MapLayersResponse> {
    const res = await fetch(`${API_BASE}/layers/${id}`);
    if (!res.ok) throw new Error('Failed to fetch map layers');
    return res.json();
  },

  async generateReport(id: string, language: 'en' | 'ne' = 'en'): Promise<ReportResponse> {
    const res = await fetch(`${API_BASE}/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis_id: id, language }),
    });
    if (!res.ok) throw new Error('Failed to generate situation report');
    return res.json();
  },

  getReportDownloadUrl(reportId: string): string {
    return `${API_BASE}/reports/${reportId}/download`;
  },

  async tracePath(startLat: number = 28.192, startLon: number = 85.352, waveVelocityMs: number = 14.0): Promise<TracePathResult> {
    const res = await fetch(`${API_BASE}/trace-path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_lat: startLat, start_lon: startLon, wave_velocity_ms: waveVelocityMs }),
    });
    if (!res.ok) throw new Error('Failed to trace flow path');
    return res.json();
  },

  async getEMSR927Validation(analysisId: string = 'latest'): Promise<EMSR927ValidationResult> {
    const res = await fetch(`${API_BASE}/validation/emsr927?analysis_id=${analysisId}`);
    if (!res.ok) throw new Error('Failed to fetch EMSR927 validation');
    return res.json();
  },

  async copilotChat(question: string, language: 'en' | 'ne' = 'en', analysisId: string = 'latest'): Promise<CopilotChatResponse> {
    const res = await fetch(`${API_BASE}/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis_id: analysisId, question, language }),
    });
    if (!res.ok) throw new Error('Failed to send copilot query');
    return res.json();
  },
};
