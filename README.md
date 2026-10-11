# FloodScope AI: Satellite-Based Flood Damage & Rescue Intelligence

> An evidence-grounded geospatial intelligence platform developed for the Multi-Modal AI Hackathon.
> Combines Copernicus Sentinel-1 SAR imagery, Copernicus DEM 30m, and OpenStreetMap (OSM) infrastructure graphs to detect flood extents, calculate road network accessibility, and generate humanitarian situation reports with an AI copilot.

---

## 🌟 Key Architecture & Capabilities

```
floodscope-ai/
├── frontend/             # React 19 + Vite + TypeScript + Tailwind CSS + React Leaflet
│   └── src/
│       ├── components/   # StatsCards, Header, SituationReportPanel, ProvenanceModal
│       ├── maps/         # Interactive React-Leaflet tactical map & layer toggles
│       └── services/     # Typed API client connected to backend endpoints
├── backend/              # Python 3.11 + FastAPI + GeoPandas + Rasterio + NetworkX
│   └── app/
│       ├── api/          # 8 REST endpoints (health, run, status, layers, reports)
│       ├── services/     # satellite.py, flood_detection.py, infrastructure.py, accessibility.py, reports.py
│       └── schemas/      # Strict Pydantic models
├── data/
│   ├── raw/              # Permitted Sentinel-1 scenes & DEM (ignored in git)
│   ├── processed/        # Exported flood_extent.tif/geojson, accessibility layers
│   └── sample/           # Validated georeferenced study AOI (Nepal Rasuwa District)
├── notebooks/            # UN-SPIDER analysis and exploratory workflows
├── tests/                # PyTest suite for geospatial pipeline and API endpoints
├── .env.example          # Environment configuration template
└── README.md
```

### 1. Satellite Flood Detection Engine (`backend/app/services/flood_detection.py`)
- Adheres to the **UN-SPIDER Recommended Practice for Radar-based Flood Mapping**:
  - Pre- and post-event Sentinel-1 C-Band SAR (12-day repeat pass, identical orbital geometry).
  - Enhanced Lee speckle filtering to minimize coherent radar noise.
  - Dual-threshold histogram binarization combining Otsu and minimum thresholding.
  - DEM terrain slope masking (>15°) to suppress radar shadow false positives in mountain valleys.
  - Permanent water body masking to isolate newly inundated surface areas.
  - Outputs georeferenced Cloud-Optimized GeoTIFF (`flood_extent.tif`) and GeoJSON vector polygons.

### 2. Infrastructure Exposure Analysis (`backend/app/services/infrastructure.py`)
- Overlays pre-event OSM buildings, roads, and bridges with candidate flood polygons.
- **Scientific Honesty Standard**: Explicitly labels results as **candidate disruptions / flood exposure**, avoiding premature claims of confirmed physical destruction.

### 3. Road Network Accessibility Graph (`backend/app/services/accessibility.py`)
- Converts OSM road segments and junctions into a weighted **NetworkX** graph.
- Simulates pre-event vs. post-event reachability from settlements to emergency clinics and hospitals.
- Pinpoints candidate disconnected settlements requiring priority relief or helicopter reconnaissance.

### 4. AI Disaster Situation Report Copilot (`backend/app/services/reports.py`)
- Ingests validated structured metrics and generates an executive situation report in **English** or **नेपाली (Nepali)**.
- Strictly grounded: Every number originates from validated system calculations; zero hallucinations.
- Highlights key uncertainties, caveats, and recommended field validation protocols.

---

## 🚀 Quick Start & Installation

### Prerequisites
- Python 3.10+ (Tested on 3.11)
- Node.js 18+ & npm

### 1. Backend Setup

```bash
cd floodscope-ai
python -m venv .venv

# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r backend/requirements.txt
```

#### Run Backend API Server
```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
The interactive Swagger API documentation will be available at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
cd floodscope-ai/frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser to access the tactical operations dashboard.

---

## 🧪 Running Tests

The test suite validates the geospatial pipeline, GeoTIFF export, NetworkX graph reachability, and all 8 REST API endpoints:

```bash
cd floodscope-ai
.\.venv\Scripts\python.exe -m pytest tests/test_pipeline.py tests/test_api.py -v
```

---

## 📡 API Endpoints Reference

| Method | Endpoint | Responsibility |
|---|---|---|
| `GET` | `/api/health` | Healthcheck and service metadata |
| `POST` | `/api/analysis/run` | Execute Sentinel-1 flood detection & accessibility analysis |
| `GET` | `/api/analysis/{id}` | Return status, metrics summary, and parameters |
| `GET` | `/api/layers/{id}` | Return interactive GeoJSON layers for Leaflet map |
| `GET` | `/api/infrastructure/{id}` | Return detailed infrastructure exposure metrics |
| `GET` | `/api/accessibility/{id}` | Return disconnected settlements and graph routing |
| `POST` | `/api/reports/generate` | Generate AI situation report (English or Nepali) |
| `GET` | `/api/reports/{id}/download`| Download generated report in Markdown format |

---

## ⚖️ Scientific Rigor, Attributions & Compliance

### Hackathon Compliance Rules
- **Permitted Data Only**: Uses Copernicus Sentinel-1, Copernicus DEM GLO-30, and OpenStreetMap data.
- **Independent Evaluation**: Copernicus Emergency Management Service EMSR927 activation maps are reserved exclusively for independent evaluation and are **not** fed into detection algorithms.
- **Same-Orbit Requirement**: S1 acquisitions adhere to identical track geometries with 12-day orbital intervals.

### Data Citations
1. **Copernicus Sentinel-1 SAR**: European Space Agency (ESA) Copernicus Sentinel data (2024).
2. **Copernicus DEM**: European Space Agency / Airbus WorldDEM Copernicus GLO-30.
3. **OpenStreetMap**: © OpenStreetMap contributors (Open Database License - ODbL).
4. **UN-SPIDER Methodology**: UN-SPIDER Recommended Practice: Radar-based Flood Mapping (AGPL-3.0 reference).

### License
This repository is licensed under the [GNU AGPL v3.0 License](https://www.gnu.org/licenses/agpl-3.0), conforming with derivative requirements of referenced radar-mapping practices.
