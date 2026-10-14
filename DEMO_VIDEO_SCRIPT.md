# FloodScope AI: 3-Minute Video Demo Script & Walkthrough
## Multimodal AI Hackathon 2026 — Track B: Mapping Flood Damage from Space

**Total Duration:** Exactly 3 Minutes (180 Seconds)  
**Presenter Tone:** Tactical, Confident, Scientifically Grounded  
**Screen Setup:** 1080p Browser Window with FloodScope AI Dashboard open at `http://localhost:5173`

---

## ⏱️ Video Timeline & Second-by-Second Breakdown

```
[0:00 - 0:30] Context & The Rescue Challenge
[0:30 - 1:10] Satellite SAR Pipeline & Physics Rigor (The 12-Day Rule)
[1:10 - 1:50] The 3 Core Rescuer Questions: Flood, Infrastructure, Graph Isolation
[1:50 - 2:25] Bilingual AI SitRep Copilot & Tactical Rescuer Chat
[2:25 - 2:45] Bonus Feature: Upstream DEM Valley Flow-Path Tracer
[2:45 - 3:00] Copernicus EMSR927 Benchmark, Limitations & Outro
```

---

## 🎬 Detailed Script & Screen Actions

### Scene 1: The Disaster Context & The Problem (0:00 – 0:30)
* **Screen Display:** Dashboard opening view showing the Trishuli river valley with satellite basemap.
* **Speaker:**
  > "On August 26, 2026, a high-altitude glacier collapsed in northern Nepal, sending a devastating avalanche and debris flood down the Bhote Koshi–Trishuli corridor.
  > Over 1,300 people died, and nearly 4,900 were reported missing.
  > In narrow Himalayan valleys, when bridges, roads, and cell towers are washed away, rescue commanders are blind.
  > This is **FloodScope AI** — the autonomous intelligence platform that tells rescuers where the damage is and who is cut off, directly from space."

---

### Scene 2: Satellite SAR Engine & Physics Rigor (0:30 – 1:10)
* **Screen Action:** Click "Re-run Analysis". Show stats cards and SAR detection layer illuminating the river corridor.
* **Speaker:**
  > "Monsoon clouds block optical satellites, so FloodScope relies on Copernicus Sentinel-1 Synthetic Aperture Radar.
  > But steep mountain walls cause severe radar distortions.
  > To solve this, our system enforces three scientific rules:
  > First, the **12-Day Orbital Geometry Rule**: we compare pre- and post-flood images from the exact same orbit track—Track 121—ensuring identical look angles.
  > Second, an **Enhanced Lee speckle filter** cleans multiplicative radar noise.
  > Third, a **metric Copernicus DEM slope mask** automatically rejects terrain slopes steeper than 15 degrees, eliminating mountain radar shadows that masquerade as water."

---

### Scene 3: The 3 Core Rescuer Questions (1:10 – 1:50)
* **Screen Action:** Toggle map layer pills: Flood Extent (cyan), Roads (orange), Settlements (isolated marked in red with warning pulse). Click on "Timure" or "Briddhim" settlement on the map to show popup.
* **Speaker:**
  > "FloodScope answers the three life-or-death questions:
  > **One: Where did it hit?** Here, mapping 4.8 square kilometers of candidate inundation and mudflow along the valley floor.
  > **Two: What was damaged?** Overlaying pre-event OpenStreetMap infrastructure snapshots—identifying 18 exposed buildings, 8.4 kilometers of severed road, and 2 vulnerable bridges.
  > **Three: Who is cut off?** Using a topological NetworkX graph, we evaluate Dijkstra reachability from every village to emergency clinics.
  > Settlements like Timure and Briddhim have lost all connecting road links, flagged instantly in red for helicopter airlifts."

---

### Scene 4: Bilingual AI Copilot & Rescuer Chat (1:50 – 2:25)
* **Screen Action:** Click "SitRep (AI)" to open the situation report panel. Toggle between "English" and "नेपाली (Nepali)". Click "🖨️ Print 1-Page SitRep". Then open "Rescuer Copilot" drawer and click the prompt chip: *"Which settlements are completely cut off?"*.
* **Speaker:**
  > "Next, our AI Situation Report Copilot.
  > Unlike standard LLMs that hallucinate numbers, FloodScope enforces **100% deterministic metric grounding**.
  > Every hectare, building, and road kilometer is injected directly from our verified geospatial tables.
  > It generates official situation reports natively in English and Nepali, formatted for immediate one-page field printing.
  > Rescuers can also query the tactical copilot interactively in English or Nepali, receiving actionable logistics guidance with verified numbers."

---

### Scene 5: Bonus Feature — Upstream Valley Flow Tracer (2:25 – 2:45)
* **Screen Action:** Click "Flow Tracer (Bonus)". Select "Upper Langtang Ridge". Click "Trace Downhill Valley Path". Show the animated flow descent and the Downstream Settlements Arrival Timeline table.
* **Speaker:**
  > "For our bonus feature, given any upstream glacial point, our D8 hydrological elevation tracer models the avalanche trajectory down the valley.
  > It computes the 1,280-meter vertical drop and provides a timeline warning: Timure in 14 minutes, Syabru Besi in 32 minutes."

---

### Scene 6: EMSR927 Benchmark, Limitations & Outro (2:45 – 3:00)
* **Screen Action:** Click "EMSR927 Benchmark". Show the 91.2% F1-Score gauge and the transparency banner.
* **Speaker:**
  > "We validated our results against official Copernicus activation EMSR927 maps—used strictly for evaluation—achieving a **91.2% F1-score**.
  > Our system respects its limitations: Sentinel satellites revisit every few days, so they map post-event damage rather than giving instant warnings.
  > FloodScope AI turns raw space data into rapid, trustworthy rescue intelligence when every minute matters. Thank you."

---

## 🎯 Tips for the Recording
1. **Resolution:** 1920x1080 at 60 fps.
2. **Audio:** Clean microphone, no background music or low instrumental background.
3. **Cursor:** Smooth mouse movements; use the clickable layer toggles to demonstrate reactivity.
4. **Attribution:** The final screen or video description must display the Copernicus, DEM, and OSM attribution text.
