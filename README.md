# FloodScope AI: Satellite-Based Flood Damage & Rescue Intelligence

> An evidence-grounded geospatial intelligence platform developed for the Multi-Modal AI Hackathon.
> Combines Copernicus Sentinel-1 SAR imagery, Copernicus DEM 30m, and OpenStreetMap (OSM) infrastructure graphs to detect flood extents, calculate road network accessibility, and generate humanitarian situation reports with an AI copilot.

---

## 🌟 Key Architecture & Capabilities

```
floodscope-ai/
├── frontend/             # React 19 + Vite + TypeScript + Tailwind CSS + React Leaflet
│   └── src/
│       ├── components/   # StatsCards, Header (mode indicator), SituationReportPanel, ProvenanceModal
│       ├── maps/         # FloodMap.tsx (ESRI Satellite & OSM dual-basemap with layer toggles)
│       └── services/     # Typed API client connected to backend endpoints
├── backend/              # Python 3.11 + FastAPI + GeoPandas + Rasterio + NetworkX
│   └── app/
│       ├── api/          # 8 REST endpoints (health, run, status, layers, infrastructure, accessibility, reports)
│       ├── services/     # satellite.py, flood_detection.py, infrastructure.py, accessibility.py, reports.py, copernicus_ingest.py
│       └── schemas/      # Strict Pydantic models with data_source_mode
├── data/
│   ├── raw/              # Permitted Sentinel-1 scenes & DEM (ignored in Git)
│   ├── processed/        # Exported flood_extent.tif/geojson, accessibility layers
│   └── sample/           # Deterministic benchmark datasets (Nepal Rasuwa, Seed 42)
├── notebooks/            # UN-SPIDER analysis and exploratory workflows
├── tests/                # Automated PyTest suite for geospatial pipeline and API endpoints
├── .env.example          # Environment configuration template
└── README.md
```

---

## 🛰️ 1. Geospatial Processing & Methodological Rigor

### A. Satellite Flood Detection Engine (`flood_detection.py`, `satellite.py`)
- **UN-SPIDER Methodology Compliance**:
  - **12-Day Orbital Rule**: Enforces exact multiples of 12 days between Sentinel-1 C-Band SAR acquisitions on identical tracks (e.g. Track 121, Descending) to preserve identical sensor geometry.
  - **Speckle Handling**: Enhanced Lee filter preserving physical edges while damping multiplicative radar speckle noise.
  - **Hybrid Binarization**: Dual-threshold histogram evaluation combining Otsu and minimum thresholding.
  - **Metric DEM Slope Masking**: Copernicus DEM 30m gradient calculation converted to ground meters per degree based on scene latitude. Excludes terrain slopes >15° to prevent radar shadow false positives in mountain valleys.
  - **Permanent Water Masking**: Isolates newly inundated flood extents from baseline riverbeds and perennial waterbodies.
  - **Nodata Propagation**: Explicitly propagates nodata validity masks across Pre-event, Post-event, and DEM layers.
  - **Outputs**: Georeferenced Cloud-Optimized GeoTIFF (`flood_extent.tif`) and vector polygons (`flood_extent.geojson`).

### B. Infrastructure Exposure Analysis (`infrastructure.py`)
- Overlays baseline OSM buildings, roads, and bridges with candidate flood polygons.
- **Scientific Honesty Standard**: Features are strictly classified as **candidate disruptions / flood exposure**, avoiding premature claims of confirmed structural destruction.

### C. Road Network Accessibility Graph (`accessibility.py`)
- Constructs a true topological **NetworkX** graph from the **full pre-event baseline road network**.
- Intermediate vertices and junctions are connected so branches and spurs correctly route to arterial highways.
- Evaluates Dijkstra shortest-path reachability from settlement centroids to emergency health posts before and after candidate flood disruptions.
- Identifies **candidate disconnected settlements** where all connecting road links are severed by flood extent.

### D. AI Situation Report Copilot (`reports.py`)
- **Deterministic Grounding Safeguards**: All quantitative statistics (area in km², exposed structures, flooded road km, isolated community counts) are deterministically rendered directly from validated backend calculations.
- The LLM (Gemini API) is constrained exclusively to synthesizing qualitative humanitarian commentary and field verification protocols.
- Features native bilingual generation in **English** and **नेपाली (Nepali)**.

---

## 🔬 2. Data Provenance Modes (Synthetic Demo vs. Real Satellite)

To maintain 100% scientific transparency and prevent misleading claims:
1. **Synthetic Benchmark Demo Mode (`data_source_mode: "synthetic_demo"`)**:
   - Seeded with a **fixed random seed (`np.random.seed(42)`)** in `backend/app/services/sample_data.py`.
   - Generates realistic benchmark Sentinel-1 backscatter (-21 dB water, -13 dB land) and DEM rasters for the Nepal Rasuwa valley coordinates (`[85.32°E, 28.12°N, 85.40°E, 28.20°N]`).
   - Enables instant local onboarding, offline unit testing, and algorithmic verification without requiring multi-gigabyte Copernicus downloads.
   - Visibly flagged in the dashboard header (`⚠️ SYNTHETIC BENCHMARK`) and in generated reports with a prominent data provenance banner.
2. **Real Copernicus Data Ingestion (`backend/app/services/copernicus_ingest.py`)**:
   - Provides programmatic queries to the Copernicus Data Space Ecosystem (CDSE) OData catalog.
   - Catalogues the real permitted Sentinel-1 GRD scenes for the August 2024 Nepal event:
     - Pre-event: `S1A_IW_GRDH_1SDV_20240814T121540_20240814T121605_055209_06BACD_2C22` (Track 121)
     - Post-event: `S1A_IW_GRDH_1SDV_20240826T121541_20240826T121606_055384_06C0C8_4F12` (Track 121, exact 12-day repeat)

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
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger documentation: `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
cd floodscope-ai/frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Running Automated Tests

```bash
cd floodscope-ai
.\.venv\Scripts\python.exe -m pytest tests/test_pipeline.py tests/test_api.py -v
```

---

## 📡 API Endpoints Reference

| Method | Endpoint | Responsibility |
|---|---|---|
| `GET` | `/api/health` | Healthcheck and service metadata |
| `POST` | `/api/analysis/run` | Execute flood detection with 12-day orbit validation |
| `GET` | `/api/analysis/{id}` | Return analysis status, summary, and metadata |
| `GET` | `/api/layers/{id}` | Return interactive GeoJSON layers for Leaflet map |
| `GET` | `/api/infrastructure/{id}` | Return detailed infrastructure exposure metrics |
| `GET` | `/api/accessibility/{id}` | Return disconnected settlements and graph routing |
| `POST` | `/api/reports/generate` | Generate AI situation report (English or Nepali) |
| `GET` | `/api/reports/{id}/download`| Download generated report in Markdown format |

---

## ⚖️ Hackathon Compliance & Citations

### Compliance Verification
- **Permitted Data Sources**: Copernicus Sentinel-1 SAR, Copernicus DEM GLO-30, and OpenStreetMap.
- **Independent Evaluation Only**: Copernicus Emergency Management Service EMSR927 activation maps are reserved strictly for independent evaluation and are **not** fed into detection algorithms.
- **Same-Orbit Requirement**: S1 acquisitions adhere to identical track geometries with 12-day orbital intervals.

### Data Citations
1. **Copernicus Sentinel-1 SAR**: European Space Agency (ESA) Copernicus Sentinel data (2024).
2. **Copernicus DEM**: European Space Agency / Airbus WorldDEM Copernicus GLO-30.
3. **OpenStreetMap**: © OpenStreetMap contributors (Open Database License - ODbL).
4. **UN-SPIDER Methodology**: UN-SPIDER Recommended Practice: Radar-based Flood Mapping (AGPL-3.0 reference).

### License
This repository is licensed under the [GNU AGPL v3.0 License](https://www.gnu.org/licenses/agpl-3.0), conforming with derivative requirements of referenced radar-mapping practices.
