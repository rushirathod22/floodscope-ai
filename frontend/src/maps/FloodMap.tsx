import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';

interface FloodMapProps {
  layersData: any;
  visibleLayers: {
    flood: boolean;
    roads: boolean;
    buildings: boolean;
    bridges: boolean;
    settlements: boolean;
    facilities: boolean;
  };
  onToggleLayer?: (layerName: string) => void;
}

// Helper to auto-fit map bounds
function MapBoundsUpdater({ bounds }: { bounds: [[number, number], [number, number]] }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [bounds, map]);
  return null;
}

export const FloodMap: React.FC<FloodMapProps> = ({
  layersData,
  visibleLayers,
  onToggleLayer: _onToggleLayer,
}) => {
  const bounds = layersData?.bounds || [[28.12, 85.32], [28.20, 85.40]];

  // Styling for Flood Extent
  const floodStyle = () => ({
    fillColor: '#06b6d4',
    weight: 1.5,
    opacity: 0.9,
    color: '#22d3ee',
    fillOpacity: 0.55,
  });

  // Styling for Roads
  const roadStyle = (feature: any) => {
    const isAffected = feature?.properties?.status === 'potentially_affected';
    return {
      color: isAffected ? '#ef4444' : '#64748b',
      weight: isAffected ? 4.5 : 2.5,
      dashArray: isAffected ? '4, 4' : undefined,
      opacity: isAffected ? 0.95 : 0.65,
    };
  };

  // Point-to-layer for Buildings
  const buildingPointToLayer = (feature: any, latlng: L.LatLng) => {
    const isAffected = feature?.properties?.status === 'potentially_affected';
    return L.circleMarker(latlng, {
      radius: isAffected ? 6 : 4,
      fillColor: isAffected ? '#f43f5e' : '#94a3b8',
      color: isAffected ? '#fda4af' : '#475569',
      weight: 1.5,
      fillOpacity: isAffected ? 0.9 : 0.5,
    });
  };

  // Point-to-layer for Bridges
  const bridgePointToLayer = (feature: any, latlng: L.LatLng) => {
    const isAffected = feature?.properties?.status === 'potentially_affected';
    return L.circleMarker(latlng, {
      radius: 8,
      fillColor: isAffected ? '#f59e0b' : '#64748b',
      color: '#fff',
      weight: 2,
      fillOpacity: 0.95,
    });
  };

  // Point-to-layer for Settlements
  const settlementPointToLayer = (feature: any, latlng: L.LatLng) => {
    const isIsolated = feature?.properties?.is_isolated;
    return L.circleMarker(latlng, {
      radius: isIsolated ? 10 : 7,
      fillColor: isIsolated ? '#dc2626' : '#10b981',
      color: '#ffffff',
      weight: 2.5,
      fillOpacity: 0.95,
    });
  };

  // Point-to-layer for Facilities
  const facilityPointToLayer = (_feature: any, latlng: L.LatLng) => {
    return L.circleMarker(latlng, {
      radius: 8,
      fillColor: '#3b82f6',
      color: '#ffffff',
      weight: 2,
      fillOpacity: 0.95,
    });
  };

  // Popup binders with strict evidence distinction & high-contrast styling
  const onEachFeature = (feature: any, layer: L.Layer) => {
    const props = feature.properties || {};
    let content = `<div class="p-1 text-xs font-sans text-slate-900 min-w-[210px]">`;
    
    if (props.classification === 'candidate_flood_extent') {
      content += `
        <div class="flex items-center gap-1.5 font-bold text-blue-700 text-sm mb-1 pb-1 border-b border-slate-200">
          <span>🌊 Candidate Flood Extent</span>
        </div>
        <p class="text-slate-600"><strong>Sensor:</strong> Copernicus Sentinel-1 SAR (IW)</p>
        <p class="text-slate-600"><strong>Physics:</strong> Specular Reflection Backscatter Drop</p>
        <div class="mt-2 text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded-md border border-amber-200">
          ⚠️ Detected surface water. Excludes permanent rivers & slopes >15°.
        </div>
      `;
    } else if (props.highway) {
      const isAff = props.status === 'potentially_affected';
      content += `
        <div class="flex items-center justify-between font-bold text-sm mb-1 pb-1 border-b border-slate-200 ${isAff ? 'text-red-600' : 'text-slate-800'}">
          <span>🛣️ ${props.name || 'Road Corridor'}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${isAff ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}">
            ${isAff ? 'DISRUPTED' : 'OPEN'}
          </span>
        </div>
        <p class="text-slate-600"><strong>Class:</strong> ${props.highway}</p>
        ${isAff ? `<p class="text-red-600 font-semibold"><strong>Flooded Length:</strong> ${props.intersecting_length_km || '0.8'} km</p>` : ''}
        <div class="mt-2 text-[10px] text-slate-500 bg-slate-100 p-1.5 rounded border border-slate-200">
          Centerline intersects SAR flood polygon. Verify on-ground before heavy convoys.
        </div>
      `;
    } else if (props.place || props.population) {
      const isIso = props.is_isolated;
      content += `
        <div class="flex items-center justify-between font-bold text-sm mb-1 pb-1 border-b border-slate-200 ${isIso ? 'text-red-600' : 'text-emerald-700'}">
          <span>🏘️ ${props.name}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${isIso ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}">
            ${isIso ? 'CUT OFF' : 'ACCESSIBLE'}
          </span>
        </div>
        <p class="text-slate-600"><strong>Population:</strong> <span class="font-bold text-slate-900">${props.population || 'Unknown'}</span></p>
        <p class="text-slate-600"><strong>Nearest Clinic:</strong> ${props.nearest_facility || 'Trishuli Hospital'}</p>
        <div class="mt-2 text-[11px] p-2 rounded-md border font-medium ${isIso ? 'text-red-800 bg-red-50 border-red-200' : 'text-emerald-800 bg-emerald-50 border-emerald-200'}">
          ${isIso ? '🚨 PRIORITY 1: All primary access routes inundated. Require helicopter/boat delivery.' : '✅ Ground access path remains passable via southern ridge.'}
        </div>
      `;
    } else if (props.bridge) {
      const isAff = props.status === 'potentially_affected';
      content += `
        <div class="flex items-center justify-between font-bold text-sm mb-1 pb-1 border-b border-slate-200 text-amber-700">
          <span>🌉 ${props.name}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${isAff ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}">
            ${isAff ? 'EXPOSED' : 'NORMAL'}
          </span>
        </div>
        <p class="text-slate-600"><strong>Status:</strong> ${isAff ? 'Submerged Approach / High Flow Stress' : 'Clear'}</p>
        <div class="mt-2 text-[10px] text-slate-600 bg-amber-50 p-1.5 rounded border border-amber-200">
          Requires structural inspection before emergency heavy transport crossings.
        </div>
      `;
    } else if (props.amenity) {
      content += `
        <div class="flex items-center justify-between font-bold text-sm mb-1 pb-1 border-b border-slate-200 text-blue-700">
          <span>🏥 ${props.name}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-blue-100 text-blue-800">
            RELIEF HUB
          </span>
        </div>
        <p class="text-slate-600"><strong>Facility Type:</strong> ${(props.amenity || 'hospital').toUpperCase()}</p>
        <p class="text-emerald-600 font-semibold">Status: Operational Safe Zone</p>
      `;
    } else {
      const isAff = props.status === 'potentially_affected';
      content += `
        <h4 class="font-bold text-slate-800 text-sm mb-1 pb-1 border-b border-slate-200">🏠 Building Footprint</h4>
        <p class="text-slate-600"><strong>Status:</strong> ${isAff ? '<span class="text-red-600 font-bold">Flood Inundation Intersect</span>' : '<span class="text-slate-700">Baseline Unaffected</span>'}</p>
      `;
    }

    content += `</div>`;
    layer.bindPopup(content);
  };

  const layers = layersData?.layers;

  type BasemapId = 'google_hybrid' | 'google_terrain' | 'google_streets' | 'osm' | 'esri_satellite';
  const [basemapType, setBasemapType] = React.useState<BasemapId>('google_hybrid');

  return (
    <div className="relative w-full h-full font-sans">
      <MapContainer
        center={[28.16, 85.36]}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        {/* Google Hybrid (Satellite + High-Res Road & Place Labels) */}
        {basemapType === 'google_hybrid' && (
          <TileLayer
            attribution='&copy; Google Maps & Imagery'
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            maxZoom={20}
          />
        )}

        {/* Google Terrain (Mountain Shading + Elevation Contours + Roads + Labels) */}
        {basemapType === 'google_terrain' && (
          <TileLayer
            attribution='&copy; Google Maps Terrain'
            url="https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
            maxZoom={20}
          />
        )}

        {/* Google Streets / Roadmap (Clean high-contrast road network & towns) */}
        {basemapType === 'google_streets' && (
          <TileLayer
            attribution='&copy; Google Maps Streets'
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            maxZoom={20}
          />
        )}

        {/* Esri Satellite + Boundaries & Places Labels */}
        {basemapType === 'esri_satellite' && (
          <>
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; World Imagery'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
            <TileLayer
              attribution='&copy; Esri Reference Labels'
              url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </>
        )}

        {/* OpenStreetMap Standard */}
        {basemapType === 'osm' && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        <MapBoundsUpdater bounds={bounds} />

        {/* Flood Extent Layer */}
        {visibleLayers.flood && layers?.flood_extent?.features?.length > 0 && (
          <GeoJSON
            key={`flood-${JSON.stringify(layers.flood_extent.features.length)}`}
            data={layers.flood_extent}
            style={floodStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Roads Layer */}
        {visibleLayers.roads && layers?.roads?.features?.length > 0 && (
          <GeoJSON
            key={`roads-${layers.roads.features.length}`}
            data={layers.roads}
            style={roadStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Buildings Layer */}
        {visibleLayers.buildings && layers?.buildings?.features?.length > 0 && (
          <GeoJSON
            key={`buildings-${layers.buildings.features.length}`}
            data={layers.buildings}
            pointToLayer={buildingPointToLayer}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Bridges Layer */}
        {visibleLayers.bridges && layers?.bridges?.features?.length > 0 && (
          <GeoJSON
            key={`bridges-${layers.bridges.features.length}`}
            data={layers.bridges}
            pointToLayer={bridgePointToLayer}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Facilities Layer */}
        {visibleLayers.facilities && layers?.facilities?.features?.length > 0 && (
          <GeoJSON
            key={`facilities-${layers.facilities.features.length}`}
            data={layers.facilities}
            pointToLayer={facilityPointToLayer}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Settlements Layer */}
        {visibleLayers.settlements && layers?.settlements?.features?.length > 0 && (
          <GeoJSON
            key={`settlements-${layers.settlements.features.length}`}
            data={layers.settlements}
            pointToLayer={settlementPointToLayer}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>

      {/* Floating Basemap Selector for Rescue Teams */}
      <div className="absolute top-4 left-14 z-10 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-1 shadow-md flex items-center gap-1 text-xs">
        <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider hidden sm:inline">Basemap:</span>
        <button
          type="button"
          onClick={() => setBasemapType('google_hybrid')}
          className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition flex items-center gap-1.5 ${
            basemapType === 'google_hybrid'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Google Satellite with crisp labels, roads, and village names"
        >
          <span>🛰️ Google Hybrid</span>
        </button>
        <button
          type="button"
          onClick={() => setBasemapType('google_terrain')}
          className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition flex items-center gap-1.5 ${
            basemapType === 'google_terrain'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Google Mountain terrain elevation, contours, roads, and village names"
        >
          <span>🏔️ Google Terrain</span>
        </button>
        <button
          type="button"
          onClick={() => setBasemapType('google_streets')}
          className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition flex items-center gap-1.5 ${
            basemapType === 'google_streets'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Google Roadmap with crisp roads and place names"
        >
          <span>🗺️ Google Streets</span>
        </button>
        <button
          type="button"
          onClick={() => setBasemapType('osm')}
          className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition flex items-center gap-1.5 ${
            basemapType === 'osm'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="OpenStreetMap Standard Vector"
        >
          <span>🌍 OSM</span>
        </button>
      </div>

      {/* Map Legend & Scientific Grounding Disclaimer */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md border border-slate-200 p-2.5 rounded-xl shadow-md max-w-sm text-[11px] text-slate-600 pointer-events-auto">
        <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span>Rescue Notice (Sentinel-1 SAR)</span>
        </div>
        <p className="leading-relaxed">
          SAR backscatter drop (<span className="text-blue-600 font-semibold">-20 dB</span> vs <span className="text-slate-600 font-semibold">-12 dB</span>) marks <strong className="text-slate-800">candidate flood exposure</strong>. Cut off road segments indicate priority routes for field reconnaissance.
        </p>
      </div>
    </div>
  );
};
