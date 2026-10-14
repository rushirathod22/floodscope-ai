"""
Test FastAPI endpoints using FastAPI TestClient
"""

from fastapi.testclient import TestClient
from backend.app.main import app

def test_api_endpoints():
    with TestClient(app) as client:
        # 1. Health check
        res_health = client.get("/api/health")
        assert res_health.status_code == 200
        assert res_health.json()["status"] == "healthy"

        # 2. Run analysis
        payload = {
            "area_id": "nepal_rasuwa",
            "pre_event_date": "2024-08-14",
            "post_event_date": "2024-08-26",
            "relative_orbit": 121,
            "polarization": "VH",
            "dem_slope_cutoff_deg": 15.0
        }
        res_run = client.post("/api/analysis/run", json=payload)
        assert res_run.status_code == 200
        analysis_data = res_run.json()
        analysis_id = analysis_data["analysis_id"]
        assert analysis_data["status"] == "completed"
        assert analysis_data["summary"]["candidate_flood_area_sq_km"] > 0

        # 3. Get analysis status
        res_status = client.get(f"/api/analysis/{analysis_id}")
        assert res_status.status_code == 200
        assert res_status.json()["analysis_id"] == analysis_id

        # 4. Get map layers GeoJSON
        res_layers = client.get(f"/api/layers/{analysis_id}")
        assert res_layers.status_code == 200
        layers_data = res_layers.json()
        assert "flood_extent" in layers_data["layers"]
        assert "buildings" in layers_data["layers"]
        assert "roads" in layers_data["layers"]
        assert "bridges" in layers_data["layers"]
        assert "settlements" in layers_data["layers"]

        # 5. Infrastructure stats
        res_infra = client.get(f"/api/infrastructure/{analysis_id}")
        assert res_infra.status_code == 200
        assert res_infra.json()["total_buildings"] > 0

        # 6. Accessibility stats
        res_access = client.get(f"/api/accessibility/{analysis_id}")
        assert res_access.status_code == 200
        assert res_access.json()["total_settlements"] > 0

        # 7. Generate report (English)
        res_report = client.post("/api/reports/generate", json={"analysis_id": analysis_id, "language": "en"})
        assert res_report.status_code == 200
        report_data = res_report.json()
        report_id = report_data["report_id"]
        assert "Emergency Flood Situation Report" in report_data["content_markdown"]

        # 8. Download report
        res_down = client.get(f"/api/reports/{report_id}/download")
        assert res_down.status_code == 200
        assert "text/markdown" in res_down.headers["content-type"]

        # 9. Test Sentinel-1 12-day orbit validation rejection
        bad_payload = {
            "area_id": "nepal_rasuwa",
            "pre_event_date": "2024-08-14",
            "post_event_date": "2024-08-19",
            "relative_orbit": 121,
            "polarization": "VH"
        }
        res_bad = client.post("/api/analysis/run", json=bad_payload)
        assert res_bad.status_code == 400
        assert "Sentinel-1 Validation Error" in res_bad.json()["detail"]

        # 10. Test Upstream Valley Flow-Path Tracer (Bonus)
        res_trace = client.post("/api/trace-path", json={"start_lat": 28.192, "start_lon": 85.352})
        assert res_trace.status_code == 200
        trace_data = res_trace.json()
        assert trace_data["total_path_length_km"] > 0
        assert "flow_path_geojson" in trace_data
        assert len(trace_data["settlements_at_risk"]) > 0

        # 11. Test Copernicus EMSR927 Reference Comparison
        res_val = client.get(f"/api/validation/emsr927?analysis_id={analysis_id}")
        assert res_val.status_code == 200
        val_data = res_val.json()
        assert val_data["activation_id"] == "EMSR927"
        assert val_data["metrics"]["f1_score"] > 0
        assert "comparison_geojson" in val_data

        # 12. Test AI Copilot Tactical Chat (English & Nepali)
        res_chat_en = client.post("/api/copilot/chat", json={
            "analysis_id": analysis_id,
            "question": "Which settlements are completely cut off from road access?",
            "language": "en"
        })
        assert res_chat_en.status_code == 200
        chat_en_data = res_chat_en.json()
        assert "isolated_settlements" in chat_en_data["grounded_metrics"]
        assert len(chat_en_data["recommended_actions"]) > 0

        res_chat_ne = client.post("/api/copilot/chat", json={
            "analysis_id": analysis_id,
            "question": "कुन कुन बस्तीहरू सम्पर्कविहीन छन्?",
            "language": "ne"
        })
        assert res_chat_ne.status_code == 200
        chat_ne_data = res_chat_ne.json()
        assert chat_ne_data["language"] == "ne"

        print("All API endpoints and validation constraints tested and passed!")

if __name__ == "__main__":
    test_api_endpoints()
