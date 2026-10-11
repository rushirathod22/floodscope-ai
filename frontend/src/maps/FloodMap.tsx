import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Layers, Eye, EyeOff } from 'lucide-react';

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
  onToggleLayer: (layerName: string) => void;
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
  onToggleLayer,
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

  // Popup binders with strict evidence distinction
  const onEachFeature = (feature: any, layer: L.Layer) => {
    const props = feature.properties || {};
    let content = `<div class="p-2 text-xs font-sans text-slate-100">`;
    
    if (props.classification === 'candidate_flood_extent') {
      content += `
        <h4 class="font-bold text-cyan-400 text-sm mb-1">🌊 Candidate Flood Extent</h4>
        <p class="text-slate-300"><strong>Sensor:</strong> Sentinel-1 SAR (IW mode)</p>
        <p class="text-slate-300"><strong>Detection:</strong> Specular Backscatter Drop (UN-SPIDER)</p>
        <div class="mt-2 text-[10px] text-amber-300 bg-amber-950/60 p-1.5 rounded border border-amber-800">
          ⚠️ Indicates detected surface water. Excludes permanent rivers & slopes >15°.
        </div>
      `;
    } else if (props.highway) {
      const isAff = props.status === 'potentially_affected';
      content += `
        <h4 class="font-bold ${isAff ? 'text-rose-400' : 'text-slate-200'} text-sm mb-1">🛣️ ${props.name || 'Road Segment'}</h4>
        <p class="text-slate-300"><strong>Classification:</strong> ${props.highway}</p>
        <p class="text-slate-300"><strong>Disruption Status:</strong> <span class="${isAff ? 'text-rose-400 font-semibold' : 'text-emerald-400'}">${isAff ? 'Candidate Disruption' : 'Accessible'}</span></p>
        ${isAff ? `<p class="text-slate-300"><strong>Overlap Length:</strong> ${props.intersecting_length_km || 'N/A'} km</p>` : ''}
        <div class="mt-2 text-[10px] text-slate-400 bg-slate-900/80 p-1.5 rounded border border-slate-700">
          Rule: Centerline overlap with SAR flood polygon. Does NOT confirm road is physically destroyed.
        </div>
      `;
    } else if (props.place || props.population) {
      const isIso = props.is_isolated;
      content += `
        <h4 class="font-bold ${isIso ? 'text-red-400' : 'text-emerald-400'} text-sm mb-1">🏘️ Settlement: ${props.name}</h4>
        <p class="text-slate-300"><strong>Estimated Population:</strong> ${props.population || 'Unknown'}</p>
        <p class="text-slate-300"><strong>Reachability:</strong> <span class="${isIso ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}">${isIso ? 'CANDIDATE DISCONNECTED' : 'Accessible'}</span></p>
        <p class="text-slate-300"><strong>Nearest Clinic:</strong> ${props.nearest_facility || 'N/A'}</p>
        <div class="mt-2 text-[10px] ${isIso ? 'text-red-300 bg-red-950/80 border-red-800' : 'text-emerald-300 bg-emerald-950/80 border-emerald-800'} p-1.5 rounded border">
          ${isIso ? '🚨 All road routes to medical facilities disrupted under candidate scenario. Priority for aerial reconnaissance.' : '✅ Path remains open via alternate routes.'}
        </div>
      `;
    } else if (props.bridge) {
      const isAff = props.status === 'potentially_affected';
      content += `
        <h4 class="font-bold text-amber-400 text-sm mb-1">🌉 Bridge: ${props.name}</h4>
        <p class="text-slate-300"><strong>Status:</strong> ${isAff ? 'Potentially Exposed / Flooded Approach' : 'Unaffected'}</p>
        <div class="mt-2 text-[10px] text-slate-400 bg-slate-900 p-1.5 rounded border border-slate-700">
          Requires physical inspection by engineering corps before heavy crossing.
        </div>
      `;
    } else if (props.amenity) {
      content += `
        <h4 class="font-bold text-blue-400 text-sm mb-1">🏥 Emergency Facility: ${props.name}</h4>
        <p class="text-slate-300"><strong>Type:</strong> ${props.amenity.toUpperCase()}</p>
      `;
    } else {
      const isAff = props.status === 'potentially_affected';
      content += `
        <h4 class="font-bold text-slate-200 text-sm mb-1">🏠 Building Structure</h4>
        <p class="text-slate-300"><strong>Exposure:</strong> ${isAff ? 'Potentially Affected (Intersects Flood)' : 'Baseline unaffected'}</p>
      `;
    }

    content += `</div>`;
    layer.bindPopup(content);
  };

  const layers = layersData?.layers;

  const [basemapType, setBasemapType] = React.useState<'satellite' | 'streets'>('satellite');

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[28.16, 85.36]}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        {basemapType === 'satellite' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; World Imagery'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        ) : (
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

      {/* Floating Tactical Layer Control Widget */}
      <div className="absolute top-4 right-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs w-64 text-slate-200">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 font-semibold text-slate-100">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Tactical Map Layers</span>
          </div>
          <span className="text-[10px] text-cyan-400 font-mono">Sentinel-1 SAR</span>
        </div>

        {/* Basemap Switcher */}
        <div className="grid grid-cols-2 gap-1 mb-2.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px]">
          <button
            onClick={() => setBasemapType('satellite')}
            className={`py-1 rounded font-medium transition ${
              basemapType === 'satellite'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🛰️ Satellite (Esri)
          </button>
          <button
            onClick={() => setBasemapType('streets')}
            className={`py-1 rounded font-medium transition ${
              basemapType === 'streets'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🗺️ OpenStreetMap
          </button>
        </div>

        <div className="space-y-1.5">
          <button
            onClick={() => onToggleLayer('flood')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition ${
              visibleLayers.flood
                ? 'bg-cyan-950/60 border-cyan-700/70 text-cyan-300'
                : 'bg-slate-800/40 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-cyan-400/80 inline-block border border-cyan-300"></span>
              <span>Candidate Flood Extent</span>
            </div>
            {visibleLayers.flood ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onToggleLayer('roads')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition ${
              visibleLayers.roads
                ? 'bg-rose-950/50 border-rose-800/60 text-rose-300'
                : 'bg-slate-800/40 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 rounded bg-rose-500 inline-block"></span>
              <span>Road Disruption Network</span>
            </div>
            {visibleLayers.roads ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onToggleLayer('settlements')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition ${
              visibleLayers.settlements
                ? 'bg-red-950/50 border-red-800/60 text-red-300'
                : 'bg-slate-800/40 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white inline-block"></span>
              <span>Settlement Accessibility</span>
            </div>
            {visibleLayers.settlements ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onToggleLayer('bridges')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition ${
              visibleLayers.bridges
                ? 'bg-amber-950/50 border-amber-800/60 text-amber-300'
                : 'bg-slate-800/40 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-300 inline-block"></span>
              <span>Bridges (Potentially Exposed)</span>
            </div>
            {visibleLayers.bridges ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onToggleLayer('buildings')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition ${
              visibleLayers.buildings
                ? 'bg-slate-800 border-slate-600 text-slate-300'
                : 'bg-slate-800/40 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block"></span>
              <span>Buildings Footprints</span>
            </div>
            {visibleLayers.buildings ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onToggleLayer('facilities')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition ${
              visibleLayers.facilities
                ? 'bg-blue-950/50 border-blue-800/60 text-blue-300'
                : 'bg-slate-800/40 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white inline-block"></span>
              <span>Medical & Relief Hubs</span>
            </div>
            {visibleLayers.facilities ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Map Legend Disclaimer */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-2.5 rounded-lg shadow-xl max-w-sm text-[11px] text-slate-400 pointer-events-auto">
        <div className="flex items-center gap-2 font-semibold text-slate-200 mb-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>Scientific Grounding Notice</span>
        </div>
        <p>
          Radar backscatter changes denote <strong className="text-cyan-300">candidate flood exposure</strong>, not confirmed structural destruction. Disrupted road segments indicate candidate route blockages for rescue prioritization.
        </p>
      </div>
    </div>
  );
};
