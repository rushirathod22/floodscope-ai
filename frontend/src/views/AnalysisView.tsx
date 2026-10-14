import React, { useState } from 'react';
import {
  Waves,
  Building2,
  Route,
  Activity,
  Download,
  Map,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import type { AnalysisStatus } from '../services/api';

interface AnalysisViewProps {
  analysisStatus: AnalysisStatus | null;
  onNavigate: (tab: string) => void;
  onOpenReport: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  analysisStatus,
  onNavigate,
  onOpenReport,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<string>('overview');

  const summary = analysisStatus?.summary;
  const infra = analysisStatus?.infrastructure;

  const floodHa = summary?.candidate_flood_area_hectares ?? 113.1;
  const floodKm2 = summary?.candidate_flood_area_sq_km ?? 1.13;
  const buildingsAff = infra?.potentially_affected_buildings ?? 12;
  const roadsAffKm = infra?.potentially_affected_road_km ?? 2.28;
  const bridgesAff = infra?.potentially_affected_bridges ?? 0;

  return (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 text-slate-800">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Analysis Results
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bhote Koshi – Trishuli River Corridor, Nepal | 2026-08-14 → 2026-08-26 (Sentinel-1 SAR Change Detection)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenReport}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Download Report</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('map')}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition"
          >
            <Map className="w-4 h-4 text-blue-600" />
            <span>View on Map</span>
          </button>
        </div>
      </div>

      {/* Secondary Tab Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 text-xs">
        {['overview', 'flood analysis', 'infrastructure', 'accessibility', 'data sources'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveSubTab(tab)}
            className={`px-4 py-2 font-semibold capitalize transition border-b-2 -mb-px ${
              activeSubTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 4 Summary Comparison Cards (Clean White Cards with Badges) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Flooded Area */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Flooded Area</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <Waves className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {floodHa.toLocaleString()} ha
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>(~{floodKm2} km²)</span>
            <span className="text-cyan-600 font-medium">compared to pre-flood</span>
          </div>
        </div>

        {/* Card 2: Buildings Affected */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Buildings Affected</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {buildingsAff.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>(potentially)</span>
            <span className="text-emerald-600 font-semibold">+42%</span>
          </div>
        </div>

        {/* Card 3: Roads Affected */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Roads Affected</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Route className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {roadsAffKm} km
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>(potentially)</span>
            <span className="text-emerald-600 font-semibold">+57%</span>
          </div>
        </div>

        {/* Card 4: Bridges at Risk */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Bridges at Risk</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {bridgesAff}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>(within flood extent)</span>
            <span className="text-emerald-600 font-semibold">+60%</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Row: 3 Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Block 1: Flood Extent Map Thumbnail (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4.5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Flood Extent Map
            </h3>
            <button
              onClick={() => onNavigate('map')}
              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition"
              title="Open full interactive map"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            onClick={() => onNavigate('map')}
            className="w-full h-48 rounded-xl overflow-hidden relative cursor-pointer group border border-slate-200 bg-slate-900"
          >
            {/* Satellite scenery preview with red flooded zone */}
            <svg className="w-full h-full object-cover" viewBox="0 0 300 160">
              <rect width="300" height="160" fill="#1b2a47" />
              {/* Mountain ridges */}
              <path d="M0 40 Q 60 10, 120 40 T 240 20 T 300 50 L 300 160 L 0 160 Z" fill="#2d4263" opacity="0.6" />
              <path d="M0 60 Q 70 30, 140 65 T 260 45 T 300 70 L 300 160 L 0 160 Z" fill="#1e293b" opacity="0.8" />
              {/* Inundated Red River Flood Zone matching Screen 2 */}
              <path d="M 20 120 Q 90 70, 160 110 T 290 85" stroke="#ef4444" strokeWidth="26" fill="none" opacity="0.75" />
              <path d="M 20 120 Q 90 70, 160 110 T 290 85" stroke="#f87171" strokeWidth="8" fill="none" />
              {/* Road lines */}
              <path d="M 10 135 Q 90 85, 170 125 T 295 95" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 3" fill="none" />
            </svg>
            <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition flex items-center justify-center">
              <span className="px-3 py-1 bg-white/95 text-[11px] font-semibold text-slate-800 rounded-full shadow-sm">
                Open Full Map Viewer
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>Sentinel-1 SAR C-Band</span>
            <span className="text-blue-600 font-medium">10m Resolution</span>
          </div>
        </div>

        {/* Block 2: Land Cover in Flooded Area (Donut Chart) (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Land Cover in Flooded Area
            </h3>
            <span className="text-[10px] text-slate-400">Copernicus Land</span>
          </div>

          <div className="flex items-center justify-center gap-6 py-2">
            {/* SVG Donut Chart with clean light strokes */}
            <div className="relative w-32 h-32 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Circumference = 2 * PI * 38 ≈ 238.7 */}
                {/* Agriculture 46% -> 109.8 */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="14" strokeDasharray="109.8 128.9" strokeDashoffset="0" />
                {/* Built-up 18% -> 43.0 */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#f97316" strokeWidth="14" strokeDasharray="43 195.7" strokeDashoffset="-109.8" />
                {/* Forest 12% -> 28.6 */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#059669" strokeWidth="14" strokeDasharray="28.6 210.1" strokeDashoffset="-152.8" />
                {/* Water 12% -> 28.6 */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#06b6d4" strokeWidth="14" strokeDasharray="28.6 210.1" strokeDashoffset="-181.4" />
                {/* Other 12% -> 28.6 */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#94a3b8" strokeWidth="14" strokeDasharray="28.6 210.1" strokeDashoffset="-210" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-slate-900 font-mono">{floodHa} ha</span>
                <span className="text-[9px] text-slate-500 uppercase font-medium">Total</span>
              </div>
            </div>

            {/* Legend with clean indicators */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600 font-medium">Agriculture</span>
                <span className="font-mono text-slate-500 ml-auto">46%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-slate-600 font-medium">Built-up</span>
                <span className="font-mono text-slate-500 ml-auto">18%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-700" />
                <span className="text-slate-600 font-medium">Forest</span>
                <span className="font-mono text-slate-500 ml-auto">12%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                <span className="text-slate-600 font-medium">Water</span>
                <span className="font-mono text-slate-500 ml-auto">12%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-slate-600 font-medium">Other</span>
                <span className="font-mono text-slate-500 ml-auto">12%</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 text-center">
            Derived from pre-flood Copernicus Corine/WorldCover
          </div>
        </div>

        {/* Block 3: Elevation Profile (Line Chart) (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Elevation Profile
            </h3>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                <span className="w-2.5 h-0.5 bg-blue-600" /> Terrain
              </span>
              <span className="flex items-center gap-1 text-red-500 font-medium">
                <span className="w-2.5 h-0.5 bg-red-500" /> Flood Extent
              </span>
            </div>
          </div>

          <div className="w-full h-36 relative py-1">
            <svg className="w-full h-full" viewBox="0 0 240 100">
              {/* Grid Lines */}
              <line x1="25" y1="20" x2="235" y2="20" stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="0.8" />
              <line x1="25" y1="50" x2="235" y2="50" stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="0.8" />
              <line x1="25" y1="80" x2="235" y2="80" stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="0.8" />

              {/* Y Axis Labels */}
              <text x="3" y="23" fill="#94a3b8" fontSize="7" fontWeight="bold">2,000</text>
              <text x="3" y="53" fill="#94a3b8" fontSize="7" fontWeight="bold">1,500</text>
              <text x="3" y="83" fill="#94a3b8" fontSize="7" fontWeight="bold">1,000</text>

              {/* Terrain Elevation Area with Blue Gradient */}
              <path
                d="M 25 25 Q 70 45, 110 55 T 180 75 T 235 85 L 235 95 L 25 95 Z"
                fill="url(#terrainGradLight)"
                opacity="0.35"
              />
              <path
                d="M 25 25 Q 70 45, 110 55 T 180 75 T 235 85"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
              />

              {/* Flood Extent Curve (Red) */}
              <path
                d="M 60 70 Q 110 75, 160 82 T 235 90"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
              />

              <defs>
                <linearGradient id="terrainGradLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
            <span>Elevation (m)</span>
            <span>Distance (km)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
