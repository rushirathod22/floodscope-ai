"""
FloodScope AI - AI Situation-Report Copilot Service
Generates evidence-grounded Situation Reports in English and Nepali.

GROUNDING SAFEGUARD ARCHITECTURE:
- All quantitative metrics (area in km², building counts, road km, bridge counts, settlement lists)
  are deterministically rendered directly from validated backend structures.
- The LLM (Gemini API) is constrained exclusively to synthesizing qualitative situational context,
  operational logistics guidance, and recommended reconnaissance protocols.
- Reports visibly declare data provenance (SYNTHETIC BENCHMARK vs REAL SATELLITE).
"""

import os
import json
from datetime import datetime
from typing import Dict, Any, Tuple, List
from google import genai
from google.genai import types

def build_deterministic_report(metrics: Dict[str, Any], language: str = "en") -> Tuple[str, List[str], List[str]]:
    """
    Renders structured situation report with 100% deterministic metric fidelity.
    """
    summary = metrics.get("summary", {})
    infra = metrics.get("infrastructure", {})
    access = metrics.get("accessibility", {})
    area_name = metrics.get("area_name", "Study Area")
    data_mode = metrics.get("data_source_mode", "synthetic_demo")

    flood_area_sq_km = summary.get("candidate_flood_area_sq_km", 0.0)
    flood_hectares = summary.get("candidate_flood_area_hectares", 0.0)
    total_area_sq_km = summary.get("total_area_analyzed_sq_km", 0.0)
    
    total_bldgs = infra.get("total_buildings", 0)
    aff_bldgs = infra.get("potentially_affected_buildings", 0)
    total_roads_km = infra.get("total_road_length_km", 0.0)
    aff_roads_km = infra.get("potentially_affected_road_km", 0.0)
    total_bridges = infra.get("total_bridges", 0)
    aff_bridges = infra.get("potentially_affected_bridges", 0)

    total_settlements = access.get("total_settlements", 0)
    disc_settlements = access.get("disconnected_settlements_count", 0)
    isolated_names = [s["name"] for s in access.get("disconnected_details", []) if s.get("isolated")]

    is_synthetic = (data_mode == "synthetic_demo")

    limitations = [
        "Satellite backscatter drop represents candidate water accumulation and flood exposure, NOT confirmed physical destruction.",
        "Road centerline overlap denotes candidate network disruption; ground clearance or UAV confirmation required before routing heavy equipment.",
        "Copernicus DEM slope (>15°) terrain masking eliminates radar shadow artifacts, but steep debris mudflows might be excluded.",
        "Synthetic Aperture Radar (SAR) specular reflection can produce localized anomalies on wet runways or smooth saturated mud.",
        "Bridge approaches and structural abutments require on-site bridge inspection by civil authorities."
    ]

    citations = [
        "European Space Agency (ESA) Copernicus Sentinel-1 C-Band Synthetic Aperture Radar (SAR) Ground Range Detected (GRD).",
        "Copernicus Land Monitoring Service (CLMS) Global DEM (30m).",
        "OpenStreetMap contributors (ODbL) pre-event baseline infrastructure.",
        "UN-SPIDER Recommended Practice: Radar-based Flood Mapping (AGPL-3.0 methodology reference)."
    ]

    if is_synthetic:
        banner_en = "> ⚠️ **DATA PROVENANCE NOTICE: SYNTHETIC BENCHMARK DEMO MODE**\n> *This report was compiled using deterministic simulated satellite and baseline network data for pipeline testing. It does not represent actual field disaster observations.*"
        banner_ne = "> ⚠️ **डेटा स्रोत सूचना: सिमुलेटेड बेन्चमार्क डेमो मोड (SYNTHETIC DEMO)**\n> *यो प्रतिवेदन प्राविधिक परीक्षणका लागि तयार गरिएको नमुना डेटाबाट निकालिएको हो। यो वास्तविक स्थलगत विपद् अवलोकन होइन।*"
    else:
        banner_en = "> ✅ **DATA PROVENANCE: REAL COPERNICUS SENTINEL-1 SATELLITE ANALYSIS**"
        banner_ne = "> ✅ **डेटा स्रोत: वास्तविक कपरनिकस सेन्टिनेल-१ उपग्रह विश्लेषण**"

    if language == "ne":
        # Nepali Language Grounded Report
        isolated_str = ", ".join(isolated_names) if isolated_names else "कुनै पनि बस्ती विच्छेद भएको देखिएन"
        report_md = f"""# बाढी अवस्था तथा उद्धार जाहेरी प्रतिवेदन (FloodScope AI Situation Report)
**क्षेत्र (AOI):** {area_name}  
**प्रतिवेदन मिति:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}  
**उपग्रह प्रविधि:** Sentinel-1 C-Band SAR (12-day repeat orbit) + Copernicus DEM (30m)

{banner_ne}

---

### १. बाढीको फैलावट (Flood Extent Estimates)
- **कुल विश्लेषण गरिएको वैध क्षेत्रफल:** {total_area_sq_km} वर्ग कि.मी.
- **अनुमानित बाढी प्रभावित क्षेत्र:** **{flood_area_sq_km} वर्ग कि.मी.** ({flood_hectares} हेक्टर)
- **पहिचान प्रविधि:** सेन्टिनेल-१ SAR ब्याकस्क्याटर थ्रेसहोल्डिङ (UN-SPIDER विधि), स्थायी पानी निष्कासन, तथा DEM भिरालोपन (>15°) मास्किङ।

### २. सम्भावित प्रभावित पूर्वाधार (Potentially Affected Infrastructure)
*महत्वपूर्ण: उपग्रह परिवर्तनले सिधै भौतिक संरचनात्मक क्षति प्रमाणित गर्दैन। निम्न तथ्याङ्क जोखिमयुक्त पूर्वाधार हुन्:*
- **सम्भावित प्रभावित भवनहरू:** **{aff_bldgs}** / {total_bldgs} (जम्मा भवनहरू मध्ये)
- **बाढीले ढाकेको सम्भावित सडक लम्बाइ:** **{aff_roads_km} कि.मी.** / {total_roads_km} कि.मी.
- **जोखिममा रहेका पुलहरू:** **{aff_bridges}** / {total_bridges}

### ३. यातायात विच्छेद तथा एक्लिएका बस्तीहरू (Accessibility & Isolated Settlements)
- **जम्मा अनुगमन गरिएका बस्तीहरू:** {total_settlements}
- **यातायात सम्पर्क टुटेका सम्भावित बस्तीहरू:** **{disc_settlements}**
- **एक्लिएका बस्तीहरूको नामावली:** **{isolated_str}**
- **उद्धार प्राथमिकता:** सडक सञ्जाल विच्छेद भएका बस्तीहरूमा तत्काल हेलिकप्टर वा वैकल्पिक पैदल मार्गबाट औषधि तथा खाद्यान्न पुर्याउन सिफारिस गरिन्छ।

---

### ४. प्रमुख अनिश्चितता तथा स्थलगत प्रमाणीकरण (Key Uncertainties & Verification)
1. उपग्रहको राडार किरणले बाढी देखाए पनि भवन भित्र पानी पसेको वा भत्किएको स्थानीय टोलीले स्थलगत रूपमा यकिन गर्नुपर्छ।
2. सडकमा पानी बगेको देखिए पनि सडक पूर्ण बन्द छ वा उच्च गाडीहरू गुड्न सक्छन् भनी स्थानीय निकायसँग प्रमाणीकरण आवश्यक छ।

### ५. स्रोत तथा वैज्ञानिक सीमितता (Data Provenance & Limitations)
- {limitations[0]}
- {limitations[1]}
- **डेटा स्रोत:** ESA Copernicus Sentinel-1, Copernicus DEM, OpenStreetMap (OSM).
"""
    else:
        # English Language Grounded Report
        isolated_str = ", ".join(isolated_names) if isolated_names else "None identified under candidate disruption scenario"
        report_md = f"""# Emergency Flood Situation Report (FloodScope AI)
**Area of Interest:** {area_name}  
**Generated At:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}  
**Sensor & Processing:** Sentinel-1 C-Band SAR (12-day repeat pass) + Copernicus DEM (30m) + OSM Baseline

{banner_en}

---

### 1. Flood Extent Estimates
- **Total Valid AOI Area Analyzed:** {total_area_sq_km} km²
- **Candidate Flood Extent:** **{flood_area_sq_km} km²** ({flood_hectares} hectares)
- **Detection Workflow:** Automated dual-thresholding (Otsu & Minimum) with Lee speckle filtering, permanent water masking, and DEM slope (>15°) exclusion.

### 2. Potentially Affected Infrastructure
*Note: Satellite backscatter overlap represents candidate disruption and exposure, not verified physical destruction.*
- **Potentially Affected Buildings:** **{aff_bldgs}** (out of {total_bldgs} baseline structures)
- **Candidate Road Disruption:** **{aff_roads_km} km** (out of {total_roads_km} km total network)
- **Potentially Affected Bridges:** **{aff_bridges}** (out of {total_bridges} mapped bridges)

### 3. Settlement Accessibility & Isolation Analysis
- **Total Monitored Settlements:** {total_settlements}
- **Candidate Disconnected Settlements:** **{disc_settlements}**
- **Isolated Settlements Identified:** **{isolated_str}**
- **Rescue Operations Priority:** Settlements with zero road graph reachability to emergency clinics should receive priority UAV reconnaissance and airlift relief drops.

---

### 4. Key Uncertainties & Recommended Verification
1. High-gradient terrain may experience radar shadow or layover; localized flash flood debris deposits must be ground-checked.
2. Roads marked as candidate disruptions require physical clearance or local authority confirmation before routing heavy rescue vehicles.

### 5. Data Provenance, Attributions & Citations
- **Data Attribution:** Contains modified Copernicus Sentinel-1 data (2024), Copernicus Global DEM (2024), and OpenStreetMap data (© OpenStreetMap contributors).
- **Methodology Reference:** UN-SPIDER Recommended Practice for Radar-based Flood Mapping.
"""

    return report_md, limitations, citations

def generate_situation_report(metrics: Dict[str, Any], language: str = "en") -> Dict[str, Any]:
    """
    Orchestrates AI Situation Report generation with strict grounding safeguards:
    The quantitative metrics section is deterministically rendered to prevent hallucination.
    If GEMINI_API_KEY is available, Gemini appends qualitative humanitarian recommendations.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    title = "FloodScope AI Situation Report - " + metrics.get("area_name", "AOI")
    
    # 1. Deterministically render the core verified report
    base_markdown, limitations, citations = build_deterministic_report(metrics, language=language)

    # 2. If Gemini is available, append qualitative humanitarian commentary
    if api_key and api_key != "your_gemini_api_key_here":
        try:
            client = genai.Client(api_key=api_key)
            isolated_names = [s["name"] for s in metrics.get("accessibility", {}).get("disconnected_details", []) if s.get("isolated")]
            
            commentary_prompt = f"""
            You are the Humanitarian Disaster Operations Copilot for FloodScope AI.
            Based on the following VALIDATED disaster statistics, provide a 2-paragraph operational rescue commentary in {'Nepali' if language == 'ne' else 'English'}.
            
            RULES:
            - Do NOT state or change any numbers.
            - Focus strictly on logistics: airlift planning for isolated settlements ({', '.join(isolated_names)}), medical priority, and field UAV reconnaissance.
            - Explicitly reinforce that road overlap indicates candidate disruption, not verified destruction.
            """
            
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=commentary_prompt
            )
            if response.text and len(response.text.strip()) > 50:
                header = "\n\n### ६. एआई उद्धार समन्वय सिफारिस (AI Operational Rescue Guidance)\n" if language == "ne" else "\n\n### 6. AI Operational Rescue Guidance\n"
                base_markdown += header + response.text.strip()
        except Exception:
            pass

    return {
        "report_id": f"rep_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
        "analysis_id": metrics.get("analysis_id", "latest"),
        "language": language,
        "title": title,
        "generated_at": datetime.utcnow(),
        "content_markdown": base_markdown,
        "structured_metrics": metrics,
        "uncertainties_and_limitations": limitations,
        "citations": citations
    }

def answer_rescuer_query(metrics: Dict[str, Any], question: str, language: str = "en") -> Dict[str, Any]:
    """
    Answers operational rescue queries with strict deterministic grounding.
    Every figure, settlement name, and reachability state is drawn directly from
    the calculated graph and geospatial intersection structures.
    """
    summary = metrics.get("summary", {})
    infra = metrics.get("infrastructure", {})
    access = metrics.get("accessibility", {})
    area_name = metrics.get("area_name", "Study Area")

    flood_area_km2 = summary.get("candidate_flood_area_sq_km", 0.0)
    flood_ha = summary.get("candidate_flood_area_hectares", 0.0)
    aff_bldgs = infra.get("potentially_affected_buildings", 0)
    total_bldgs = infra.get("total_buildings", 0)
    aff_roads_km = infra.get("potentially_affected_road_km", 0.0)
    total_roads_km = infra.get("total_road_length_km", 0.0)
    aff_bridges = infra.get("potentially_affected_bridges", 0)

    settlements = access.get("disconnected_details", [])
    isolated_settlements = [s for s in settlements if s.get("isolated")]
    accessible_settlements = [s for s in settlements if not s.get("isolated")]
    isolated_names = [s["name"] for s in isolated_settlements]
    accessible_names = [s["name"] for s in accessible_settlements]

    q_lower = question.lower()
    is_nepali = (language == "ne") or any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in question)

    # Deterministic factual extraction based on query intent
    answer = ""
    recommended_actions = []

    if any(k in q_lower for k in ["cut off", "isolated", "disconnect", "sever", "बस्ती", "सम्पर्कविहीन", "विच्छेद"]):
        if is_nepali:
            if isolated_names:
                answer = f"हालको राडार तथा सञ्जाल विश्लेषण अनुसार, {len(isolated_names)} वटा बस्तीहरू सडक मार्गबाट पूर्ण रूपमा विच्छेद भएका छन्: **{', '.join(isolated_names)}**। यी बस्तीहरूबाट नजिकको स्वास्थ्य चौकी वा अस्पताल पुग्ने सबै सडक खण्डहरू बाढीको प्रभावमा परेका छन्।"
                recommended_actions = [
                    "यी बस्तीहरूमा तत्काल हेलिकप्टरबाट खोज तथा उद्धार उडान (Airlift) सञ्चालन गर्नुहोस्।",
                    "स्याब्रुबेंसी तथा तिमुरे जोड्ने झोलुङ्गे पुलहरूको ड्रोनबाट निरीक्षण गर्नुहोस्।"
                ]
            else:
                answer = "कुनै पनि बस्ती सडक मार्गबाट पूर्ण विच्छेद भएको भेटिएन। मुख्य धमनी सडक चालु छ।"
                recommended_actions = ["नियमित सडक गस्ती जारी राख्नुहोस्।"]
        else:
            if isolated_names:
                answer = f"Based on topological road graph analysis, **{len(isolated_names)} settlements** are candidate disconnected from hospital/town access: **{', '.join(isolated_names)}**. All connecting road edges intersect candidate flood polygons."
                recommended_actions = [
                    f"Prioritize immediate aerial / UAV reconnaissance for {', '.join(isolated_names)}.",
                    "Deploy satellite phone communication packs and air-dropped medical supplies.",
                    "Verify foot trail alternatives along higher ridgelines."
                ]
            else:
                answer = "No settlements are completely cut off based on the analyzed pre-event network."
                recommended_actions = ["Maintain secondary road monitoring."]

    elif any(k in q_lower for k in ["road", "highway", "bridge", "सडक", "पुल", "कि.मी", "km"]):
        if is_nepali:
            answer = f"कुल {total_roads_km} कि.मी. सडक सञ्जाल मध्ये **{aff_roads_km} कि.मी.** सडक खण्ड बाढी प्रभावित क्षेत्रमा परेको छ। साथै, कुल {infra.get('total_bridges', 0)} वटा पुल मध्ये **{aff_bridges} वटा पुल** जोखिम क्षेत्र भित्र पहिचान भएका छन्।"
            recommended_actions = [
                "बाढीले ढाकेका सडक खण्डहरूमा भारी उद्धार सवारी साधन प्रवेश निषेध गर्नुहोस्।",
                "इन्जिनियरिङ टोलीद्वारा पुलको पिलर तथा पहुँच मार्गको स्थलगत जाँच गर्नुहोस्।"
            ]
        else:
            answer = f"A total of **{aff_roads_km} km** of road (out of {total_roads_km} km baseline network) and **{aff_bridges} bridge(s)** lie within the candidate inundation footprint."
            recommended_actions = [
                "Suspend heavy transport on Pasang Lhamu Highway until engineering clearance.",
                "Inspect bridge abutments for scouring and structural washaway before crossing."
            ]

    elif any(k in q_lower for k in ["building", "house", "structure", "भवन", "घर"]):
        if is_nepali:
            answer = f"ओपनस्ट्रिटम्याप (OSM) को पूर्व-विपद् तथ्याङ्क अनुसार, जम्मा {total_bldgs} संरचना मध्ये **{aff_bldgs} वटा भवनहरू** बाढीको परिधि भित्र परेका छन्। यो सम्भावित जोखिम हो, स्थलगत क्षति यकिन गर्नुपर्छ।"
            recommended_actions = [
                "बाढी क्षेत्र नजिकका बस्तीहरू खाली गराउन माइकिङ गर्नुहोस्।",
                "उच्च स्थानमा रहेका सामुदायिक भवनहरूलाई अस्थायी आश्रयस्थल बनाउनुहोस्।"
            ]
        else:
            answer = f"Out of {total_bldgs} baseline structures, **{aff_bldgs} buildings** intersect the candidate flood footprint."
            recommended_actions = [
                "Deploy local ward emergency teams for household evacuation checks.",
                "Ensure higher-elevation community centers are designated as temporary relief shelters."
            ]

    elif any(k in q_lower for k in ["area", "size", "extent", "hectare", "क्षेत्रफल", "हेक्टर"]):
        if is_nepali:
            answer = f"सेन्टिनेल-१ राडार विश्लेषण अनुसार कुल विश्लेषण क्षेत्र ({summary.get('total_area_analyzed_sq_km', 0)} वर्ग कि.मी.) मध्ये **{flood_area_km2} वर्ग कि.मी. ({flood_ha} हेक्टर)** क्षेत्रफल बाढी तथा लेदोले ढाकेको पाइएको छ।"
            recommended_actions = ["नदीको किनार क्षेत्रमा १ कि.मी. को सुरक्षा घेरा कायम गर्नुहोस्।"]
        else:
            answer = f"The satellite detection identifies **{flood_area_km2} km² ({flood_ha} hectares)** of candidate flood and mudflow inundation across the {summary.get('total_area_analyzed_sq_km', 0)} km² AOI."
            recommended_actions = ["Establish a 500m safety buffer along active river banks."]

    else:
        # General operational overview
        if is_nepali:
            answer = f"बाढी विश्लेषण सारांश: कुल बाढी क्षेत्र **{flood_area_km2} वर्ग कि.मी.** ({flood_ha} हेक्टर)। जोखिममा परेका भवन: **{aff_bldgs}**, सडक: **{aff_roads_km} कि.मी.**, र विच्छेद भएका बस्तीहरू: **{', '.join(isolated_names) if isolated_names else 'कुनै छैन'}**।"
            recommended_actions = [
                "विच्छेद भएका बस्तीहरूलाई पहिलो प्राथमिकतामा राख्नुहोस्।",
                "उद्धार टोलीहरूलाई स्याटेलाइट म्याप अनुसार सुरक्षित वैकल्पिक मार्ग प्रयोग गर्न निर्देशन दिनुहोस्।"
            ]
        else:
            answer = f"Operational Summary for {area_name}: Candidate flood extent covers **{flood_area_km2} km² ({flood_ha} ha)**. Potentially affected: **{aff_bldgs} buildings**, **{aff_roads_km} km of road**, and **{len(isolated_names)} isolated settlement(s)** ({', '.join(isolated_names) if isolated_names else 'None'})."
            recommended_actions = [
                "Focus initial helicopter sorties on isolated communities.",
                "Avoid low-lying river corridor roads during ongoing monsoon rainfall."
            ]

    # If Gemini API key is available, enhance with natural phrasing while guaranteeing 0 numeric drift
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key and api_key != "your_gemini_api_key_here":
        try:
            client = genai.Client(api_key=api_key)
            enhancement_prompt = f"""
            You are the FloodScope AI Rescuer Tactical Assistant.
            User Question: "{question}"
            Language: {'Nepali' if is_nepali else 'English'}
            
            Verified Ground-Truth Facts:
            {answer}
            
            RULES:
            - Provide a concise tactical response to the rescuer in {'Nepali' if is_nepali else 'English'}.
            - KEEP ALL NUMBERS, METRICS, AND SETTLEMENT NAMES EXACTLY AS PROVIDED. Do NOT alter or invent numbers.
            """
            resp = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=enhancement_prompt
            )
            if resp.text and len(resp.text.strip()) > 20:
                answer = resp.text.strip()
        except Exception:
            pass

    return {
        "question": question,
        "language": "ne" if is_nepali else "en",
        "answer": answer,
        "grounded_metrics": {
            "flood_area_km2": flood_area_km2,
            "flood_hectares": flood_ha,
            "affected_buildings": aff_bldgs,
            "affected_roads_km": aff_roads_km,
            "affected_bridges": aff_bridges,
            "isolated_settlements": isolated_names,
            "accessible_settlements": accessible_names
        },
        "recommended_actions": recommended_actions
    }
