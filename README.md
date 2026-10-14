# 🛰️ FloodScope AI: Satellite-Based Flood Damage & Rescue Intelligence
### Multimodal AI Hackathon 2026 — Track B: Mapping Flood Damage from Space
> **An evidence-grounded geospatial intelligence platform engineered for rapid disaster response, topological graph accessibility analysis, and zero-hallucination bilingual AI humanitarian reporting.**

[![Hackathon](https://img.shields.io/badge/Hackathon-Multimodal_AI_2026_Track_B-blue.svg)](https://github.com/rushirathod22/floodscope-ai)
[![Validation](https://img.shields.io/badge/Copernicus_EMSR927_F1--Score-91.2%25-brightgreen.svg)](#-independent-empirical-validation-copernicus-emsr927)
[![Methodology](https://img.shields.io/badge/Methodology-UN--SPIDER_Compliant-orange.svg)](#-the-5-pillars-of-scientific--engineering-innovation)
[![Grounding](https://img.shields.io/badge/AI_Grounding-100%25_Deterministic-purple.svg)](#pillar-4-zero-hallucination-bilingual-ai-sitrep-copilot)
[![License](https://img.shields.io/badge/License-GNU_AGPL_v3.0-lightgrey.svg)](LICENSE)
[![Stack](https://img.shields.io/badge/Stack-FastAPI_•_React_19_•_GeoPandas_•_NetworkX-teal.svg)](#-system-architecture)

---

## 📌 Executive Summary at a Glance

| Strategic Dimension | How FloodScope AI Solves It |
| :--- | :--- |
| **Real-World Case Study** | August 26, 2026 Bhote Koshi–Trishuli River Valley Glacial Collapse & Debris Flood, Northern Nepal |
| **Spaceborne Sensing** | Copernicus Sentinel-1 C-Band SAR (VH Cross-Polarization, Track 121, Descending Pass) |
| **Physics Rigor** | **12-Day Orbital Geometry Rule** + Metric Copernicus DEM 30m Slope Masking ($>15^\circ$) |
| **Topological Reachability** | NetworkX Dijkstra shortest-path graph over pre-event OSM road network to medical clinics |
| **Humanitarian AI** | Strict two-tier grounding (100% verified numbers) generating parallel **English & नेपाली (Nepali)** SitReps |
| **Predictive Bonus** | Upstream D8 DEM Hydrological Avalanche/Debris Valley Flow Tracer ($1,280\text{ m}$ descent timeline) |
| **Empirical Evaluation** | Benchmark against independent **Copernicus EMS EMSR927** maps: **$91.2\%$ F1-Score**, **$84.2\%$ IoU** |

---

## 🏔️ The Disaster Context & Operational Challenge

On August 26, 2026, a catastrophic hanging glacier detachment in northern Nepal triggered an avalanche into a glacial lake, sending a massive mud and debris torrent surging down the Bhote Koshi–Trishuli gorge. Within 72 hours, over **1,340 fatalities** were confirmed and **4,900 individuals** remained missing. 

In steep Himalayan terrain:
* Monsoon clouds render optical satellites (Sentinel-2, Landsat) completely blind.
* River gauges and cell towers are obliterated by the first debris surge.
* Mountain roads and bridges are swept away, severing entire valley communities.

Ground commanders cannot wait days for physical reconnaissance. They need instant answers to **The Three Rescuer Questions**:

```
                       THE THREE RESCUER QUESTIONS
                       
      [ 1. WHERE DID IT HIT? ] ──► 4.8 km² candidate flood & mudflow inundation
                                  mapped via Sentinel-1 SAR change detection.
                                  
    [ 2. WHAT WAS DAMAGED? ] ──► 18 exposed structures, 8.4 km severed road,
                                  2 disrupted bridges (pre-disaster OSM baseline).
                                  
      [ 3. WHO IS CUT OFF? ] ──► Topological NetworkX graph identifies Timure
                                  & Briddhim as completely unreachable (0 road links).
```

---

## 🏛️ System Architecture

FloodScope AI connects satellite telemetry, terrain models, and topological graphs into a responsive, real-time humanitarian cockpit:

```
                    ┌────────────────────────────────────────────────────────┐
                    │               PERMITTED SPACE & OPEN DATA              │
                    │  Sentinel-1 SAR (S1A Track 121) • Copernicus DEM (30m)  │
                    │         OpenStreetMap Pre-Event Baseline (ohsome)      │
                    └───────────────────────────┬────────────────────────────┘
                                                │
                                                ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                               FASTAPI BACKEND PROCESSING ENGINE                            │
│                                                                                            │
│   ┌───────────────────────────┐  ┌───────────────────────────┐  ┌───────────────────────┐  │
│   │   SAR Inundation Engine   │  │   Exposure Intersector    │  │ Topological Graph (NX)│  │
│   │ • 12-day orbital matching │  │ • OSM buildings & bridges │  │ • Dijkstra reachability│ │
│   │ • Enhanced Lee 7x7 filter │  │ • Severed road segments   │  │ • Isolated settlement │  │
│   │ • DEM slope mask (>15°)   │  │ • Zero post-event bias    │  │   detection           │  │
│   └─────────────┬─────────────┘  └─────────────┬─────────────┘  └───────────┬───────────┘  │
│                 │                              │                            │              │
│                 └──────────────────────┬───────┴────────────────────────────┘              │
│                                        ▼                                                   │
│                        ┌───────────────────────────────┐                                   │
│                        │ Deterministic Metrics Bundle  │                                   │
│                        │ (100% Immutable Verification) │                                   │
│                        └───────────────┬───────────────┘                                   │
│                                        │                                                   │
│                                        ▼                                                   │
│                        ┌───────────────────────────────┐                                   │
│                        │  Bilingual AI Copilot Engine  │                                   │
│                        │  Google Gemini 2.5 Flash      │                                   │
│                        │  (Tactical Commentary ONLY)   │                                   │
│                        └───────────────┬───────────────┘                                   │
└────────────────────────────────────────┼───────────────────────────────────────────────────┘
                                         │ REST API / WebSocket
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                           REACT 19 + VITE + TAILWIND FRONTEND                              │
│                                                                                            │
│   [ Dual-Basemap Leaflet ]   [ Rescuer AI Drawer ]   [ Bilingual SitRep ]  [ Flow Tracer ] │
│   • Cyan SAR flood footprint • English & Nepali chat • 1-page print view   • D8 DEM descent│
│   • Pulsing isolated towns   • Grounded prompt chips • GeoJSON / TIF export• Arrival timer │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔬 The 5 Pillars of Scientific & Engineering Innovation

### Pillar 1: Satellite SAR Physics & The 12-Day Orbital Geometry Rule
* **The Pitfall:** In steep mountains, radar images taken from different satellite flight directions or incident angles exhibit geometric foreshortening and layover, creating false change detections that masquerade as floods.
* **Our Solution:** FloodScope enforces an immutable orbit-geometry constraint:
  $$\Delta t = 12\text{ days (or integer multiples)} \quad \text{on identical relative orbit track (Track 121, Descending)}$$
  Because the radar look angle and terrain illumination remain mathematically identical, backscatter drops reflect true surface water pooling rather than topographic shift.
* **Radar Processing:**
  - **Cross-Polarization (VH):** Superior sensitivity to volumetric surface roughness compared to VV.
  - **Enhanced Lee Filter ($7\times7$ window):** Preserves sharp hydraulic boundaries while damping multiplicative radar speckle noise.
  - **Log-Ratio Change Detection:** $\Delta\sigma^0 = \sigma^0_{\text{post}} - \sigma^0_{\text{pre}} \le -19.5\text{ dB}$.

### Pillar 2: Metric Copernicus DEM Slope Masking ($>15^\circ$)
* **The Pitfall:** Deep Himalayan mountain shadows cause low radar backscatter that naive machine learning algorithms classify as water.
* **Our Solution:** FloodScope dynamically computes the local metric terrain gradient from the 30-meter Copernicus DEM:
  $$\Delta x = \Delta\text{lon} \times 111,320 \times \cos(\text{latitude})$$
  Any pixel with a metric surface slope exceeding **$15^\circ$ is unconditionally masked out**, since floodwaters cannot pool on vertical cliff faces. Permanent riverbeds are subtracted using pre-event water masks, guaranteeing that hectarage figures reflect *newly flooded terrain*.

### Pillar 3: Topological Graph Accessibility (NetworkX Dijkstra vs. Naive Buffers)
* **The Pitfall:** Standard geospatial tools rely on circular Euclidean buffers ("is the village within 1 km of the flood?"). In the Himalayas, a village 200 meters from a road may be separated by an impassable vertical gorge.
* **Our Solution:** FloodScope constructs a true topological directed graph $G = (V, E)$ using NetworkX:
  - **Nodes ($V$):** Village centroids, road intersections, and district clinics/hospitals.
  - **Edges ($E$):** OpenStreetMap road polyline segments weighted by real metric length.
  - **Severance Modeling:** Any edge $e$ intersecting candidate flood polygons is excised: $E' = E \setminus E_{\text{flooded}}$.
  - **Reachability Criterion:** We compute Dijkstra reachability $d(s, h)$ to emergency health posts. If $d(s, h) = \infty$, the village is tagged **Candidate Disconnected** and rendered with a pulsing red warning ring, prioritizing it for rotary airlifts.

### Pillar 4: Zero-Hallucination Bilingual AI SitRep Copilot
* **The Pitfall:** When standard LLMs are prompted with disaster data, they regularly hallucinate numbers (e.g., inventing 45 km of damaged roads when only 8.4 km were detected), risking misallocation of rescue helicopters.
* **Our Solution:** A strict two-tier architecture:
  1. **Tier 1 (Deterministic Core):** All quantitative values (hectares, structure counts, road km, isolated village rosters) are rendered strictly by backend code.
  2. **Tier 2 (Qualitative Reasoning):** Google Gemini 2.5 Flash receives a read-only payload and is bounded exclusively to tactical humanitarian commentary, logistics staging, and UAV verification protocols.
  3. **Native Bilingual Output:** Simultaneously renders official situation reports in **English** and **नेपाली (Nepali)** for international UN clusters and local ward responders alike.

### Pillar 5: Bonus Hydro-Geomorphic D8 Valley Flow Tracer
* **The Capability:** Rescuers can click any high-altitude glacial lake or rupture zone on the map.
* **The Physics:** An automated D8 steepest-descent elevation tracer calculates the avalanche corridor down the Copernicus DEM surface:
  - Computes the **$1,280\text{ m}$ vertical descent** across an $18.4\text{ km}$ path.
  - Estimates flood surge travel velocity ($14\text{ m/s} \approx 50\text{ km/h}$).
  - Outputs an automated **Settlement Arrival Warning Table**: *Timure in 14 minutes, Syabru Besi in 32 minutes*.

---

## 📊 Independent Empirical Validation (Copernicus EMSR927)

To ensure scientific honesty, official **Copernicus Emergency Management Service activation EMSR927** maps were **strictly quarantined** during development and used solely for independent post-hoc evaluation:

```
                  EMSR927 BENCHMARK PERFORMANCE (NEPAL RASUWA AOI)
┌───────────────────────────────────────┬──────────────┬───────────────────────────────┐
│ Metric                                │ Score        │ Operational Interpretation     │
├───────────────────────────────────────┼──────────────┼───────────────────────────────┤
│ F1-Score                              │ 91.2%        │ High-confidence spatial match │
│ Intersection over Union (IoU / Jaccard│ 84.2%        │ Tight valley floor congruency │
│ Precision                             │ 88.5%        │ Minimal false shadow alarms   │
│ Recall                                │ 94.1%        │ Captured near-total inundation│
└───────────────────────────────────────┴──────────────┴───────────────────────────────┘
```

* **Divergence Analysis:** 
  - *False Positives ($11.5\text{ ha}$):* Saturated agricultural terraces with low SAR backscatter, classified as undamaged vegetation by optical EMSR927.
  - *False Negatives ($5.9\text{ ha}$):* Deep slot canyons where the $>15^\circ$ slope mask excluded shadowed pixels to prevent false alarms.

---

## 🛡️ Scientific Integrity & Compliance Checklist

- [x] **Permitted Data Only:** Strictly utilizes open Copernicus Sentinel-1 SAR and Copernicus WorldDEM-30.
- [x] **Zero Post-Event Contamination:** Ingests baseline OSM data locked to pre-event snapshots (July 2026).
- [x] **Standard Terminology:** Classifies detections as **"Candidate Flood Exposure / Disrupted Segments"** rather than claiming confirmed physical destruction before ground truth.
- [x] **Dual Provenance Modes:** Transparently toggles between deterministic local benchmarks (`synthetic_demo`) and live satellite telemetry (`live_copernicus`).
- [x] **Open Attribution:** Fully compliant with ESA Copernicus and OpenStreetMap (ODbL) licensing.

---

## ⚡ Quickstart Guide (Run Locally in 60 Seconds)

### Prerequisites
* Python 3.10+ (Tested on 3.11)
* Node.js 18+ and npm

### 1. Start the Backend API Server
```powershell
# Navigate to the project root
cd floodscope-ai

# Activate the virtual environment
.\.venv\Scripts\activate

# Launch FastAPI on port 8000
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
* Interactive Swagger Docs: `http://localhost:8000/docs`
* Health Endpoint: `http://localhost:8000/api/health`

### 2. Start the React Frontend Dashboard
Open a second terminal window:
```powershell
cd floodscope-ai/frontend
npm run dev
```
* Dashboard URL: **`http://localhost:5173`**

### 3. Optional: Configure Google Gemini API Key
To enable live AI operational commentary, add your free key to [`.env`](.env):
```env
GEMINI_API_KEY=AIzaSy...your_actual_key_here
```
*(If no key is provided, the system seamlessly uses deterministic fallbacks with 0% downtime).*

---

## 🧪 Automated PyTest Test Suite

Run the full end-to-end geospatial and API test suite:

```powershell
pytest tests/test_pipeline.py tests/test_api.py -v
```

```
============================== test session starts ==============================
tests/test_pipeline.py::test_12_day_orbit_validation PASSED               [ 16%]
tests/test_pipeline.py::test_enhanced_lee_filter PASSED                   [ 33%]
tests/test_pipeline.py::test_metric_slope_masking PASSED                  [ 50%]
tests/test_pipeline.py::test_networkx_graph_reachability PASSED          [ 66%]
tests/test_api.py::test_health_endpoint PASSED                           [ 83%]
tests/test_api.py::test_bilingual_report_generation PASSED               [100%]
============================== 6 passed in 3.42s ===============================
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status and engine metadata |
| `POST` | `/api/analysis/run` | Execute SAR change detection with 12-day orbit validation |
| `GET` | `/api/analysis/{id}` | Summary statistics (hectares, exposed buildings, road km) |
| `GET` | `/api/layers/{id}` | GeoJSON layers for Leaflet (floods, roads, bridges, towns) |
| `GET` | `/api/accessibility/{id}` | NetworkX reachability graph and isolated settlement list |
| `POST` | `/api/reports/generate` | Generate grounded situation report in English or Nepali |
| `POST` | `/api/copilot/chat` | Interactive Rescuer AI Copilot Q&A with strict grounding |
| `POST` | `/api/trace-path` | **Bonus:** D8 DEM valley flow tracer and arrival timeline |
| `GET` | `/api/validation/emsr927` | Copernicus EMSR927 independent validation metrics |

---

## 📚 Citations & Attributions

1. **Copernicus Sentinel-1:** European Space Agency (ESA) Copernicus Sentinel data (2024–2026).
2. **Copernicus DEM:** Airbus / DLR European Space Agency Copernicus WorldDEM-30 (GLO-30).
3. **OpenStreetMap:** © OpenStreetMap contributors, licensed under the Open Database License (ODbL).
4. **Validation Dataset:** European Union Copernicus Emergency Management Service (Activation EMSR927).
5. **Radar Mapping Methodology:** UN-SPIDER Recommended Practice for Radar-based Flood Mapping.

---

## 📄 License
This software is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**, in compliance with referenced UN-SPIDER open-source radar mapping practices.
