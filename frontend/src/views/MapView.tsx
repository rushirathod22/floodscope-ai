import React, { useState } from 'react';
import {
  Layers,
  Search,
  Calendar,
  RefreshCw,
  Mountain,
  Award
} from 'lucide-react';
import { FloodMap } from '../maps/FloodMap';
import type { MapLayersResponse } from '../services/api';

interface MapViewProps {
  layersData: MapLayersResponse | null;
  onRunAnalysis: (areaId?: string, preDate?: string, postDate?: string) => void;
  isAnalyzing: boolean;
  onOpenFlowTracer: () => void;
  onOpenEMSR927: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  layersData,
  onRunAnalysis,
  isAnalyzing,
  onOpenFlowTracer,
  onOpenEMSR927,
}) => {
  const [studyArea, setStudyArea] = useState<string>('bhote_koshi');
  const [preDate, setPreDate] = useState<string>('2026-08-14');
  const [postDate, setPostDate] = useState<string>('2026-08-26');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [opacity, setOpacity] = useState<number>(70);
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState<boolean>(true);

  // Layer Visibility States
  const [visibleLayers, setVisibleLayers] = useState({
    flood: true,
    roads: true,
    buildings: true,
    bridges: true,
    settlements: true,
    facilities: true,
    dem: false,
  });

  const toggleLayer = (layerName: string) => {
    setVisibleLayers((prev: any) => ({
      ...prev,
      [layerName]: !prev[layerName],
    }));
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 overflow-hidden relative">
      {/* Top Filter & Control Bar (Clean White Theme) */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-20 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Study Area Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Study Area</span>
            <select
              value={studyArea}
              onChange={(e) => setStudyArea(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="bhote_koshi">Bhote Koshi – Trishuli River Corridor (Nepal)</option>
              <option value="ulua_honduras">Ulua Basin (UN-SPIDER Benchmark)</option>
            </select>
          </div>

          {/* Pre-Flood Date */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pre-Flood Date</span>
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <input
                type="date"
                value={preDate}
                onChange={(e) => setPreDate(e.target.value)}
                className="bg-transparent text-xs text-slate-800 focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Post-Flood Date */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Post-Flood Date</span>
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <input
                type="date"
                value={postDate}
                onChange={(e) => setPostDate(e.target.value)}
                className="bg-transparent text-xs text-slate-800 focus:outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenFlowTracer}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-semibold rounded-lg transition"
            title="Trace uphill glacial outburst flood path down valley (Bonus)"
          >
            <Mountain className="w-3.5 h-3.5 text-amber-600" />
            <span>Flow Tracer</span>
          </button>

          <button
            type="button"
            onClick={onOpenEMSR927}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg transition"
            title="Copernicus EMSR927 Reference Benchmark"
          >
            <Award className="w-3.5 h-3.5 text-blue-600" />
            <span>EMSR927</span>
          </button>

          <button
            type="button"
            onClick={() => onRunAnalysis(studyArea, preDate, postDate)}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing SAR...' : 'Run Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="flex-1 relative min-h-0">
        {/* Floating Search Bar */}
        <div className="absolute top-4 left-4 z-10 w-72 sm:w-80 shadow-md">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location..."
              className="w-full bg-white/95 backdrop-blur-md border border-slate-300 text-xs text-slate-800 rounded-xl pl-9 pr-8 py-2 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>
        </div>

        {/* Floating Map Layers Control Panel */}
        <div className="absolute top-4 right-4 z-10 w-64 sm:w-72 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg overflow-hidden transition">
          <div
            onClick={() => setIsLayersPanelOpen(!isLayersPanelOpen)}
            className="px-4 py-3 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none bg-slate-50/60"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Map Layers</h3>
            </div>
            <span className="text-[10px] text-slate-400">{isLayersPanelOpen ? 'Collapse' : 'Expand'}</span>
          </div>

          {isLayersPanelOpen && (
            <div className="p-3.5 space-y-3">
              {/* Layers List */}
              <div className="space-y-1.5 text-xs">
                {/* Sentinel-1 */}
                <label className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs border border-blue-500 bg-blue-100" />
                    <span className="text-slate-700">Satellite Imagery (Sentinel-1)</span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="accent-blue-600 rounded"
                  />
                </label>

                {/* Flood Extent */}
                <label className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs bg-red-500/80 border border-red-600" />
                    <span className="text-slate-700 font-medium">Flood Extent (Detected)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={visibleLayers.flood}
                    onChange={() => toggleLayer('flood')}
                    className="accent-red-600 rounded"
                  />
                </label>

                {/* Affected Buildings */}
                <label className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="text-slate-700">Affected Buildings</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={visibleLayers.buildings}
                    onChange={() => toggleLayer('buildings')}
                    className="accent-orange-500 rounded"
                  />
                </label>

                {/* Affected Roads */}
                <label className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-1 bg-amber-400 rounded-xs" />
                    <span className="text-slate-700">Affected Roads</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={visibleLayers.roads}
                    onChange={() => toggleLayer('roads')}
                    className="accent-amber-500 rounded"
                  />
                </label>

                {/* Affected Bridges */}
                <label className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 border-t-4 border-r-4 border-amber-600 rotate-45" />
                    <span className="text-slate-700">Affected Bridges</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={visibleLayers.bridges}
                    onChange={() => toggleLayer('bridges')}
                    className="accent-amber-600 rounded"
                  />
                </label>

                {/* Settlements */}
                <label className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                    <span className="text-slate-700">Settlements (Disconnected)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={visibleLayers.settlements}
                    onChange={() => toggleLayer('settlements')}
                    className="accent-red-600 rounded"
                  />
                </label>

                {/* Hospitals & Health Centers */}
                <label className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 text-white text-[8px] flex items-center justify-center font-bold">
                      +
                    </span>
                    <span className="text-slate-700">Hospitals & Health Centers</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={visibleLayers.facilities}
                    onChange={() => toggleLayer('facilities')}
                    className="accent-blue-600 rounded"
                  />
                </label>

                {/* Terrain DEM */}
                <label className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs bg-slate-300" />
                    <span className="text-slate-700">Terrain (DEM)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={visibleLayers.dem}
                    onChange={() => toggleLayer('dem')}
                    className="accent-slate-600 rounded"
                  />
                </label>
              </div>

              {/* Opacity Slider */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>Layer Opacity</span>
                  <span className="font-mono text-blue-600 font-semibold">{opacity}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Basemap Switcher Buttons */}
              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  className="flex-1 py-1 px-2 text-xs font-semibold rounded-lg bg-slate-900 text-white shadow-xs"
                >
                  Satellite
                </button>
                <button
                  type="button"
                  className="flex-1 py-1 px-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Terrain
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Real Leaflet Map Engine */}
        <FloodMap
          layersData={layersData}
          visibleLayers={visibleLayers}
          onToggleLayer={toggleLayer}
        />
      </div>
    </div>
  );
};
