import React from 'react';
import {
  Waves,
  Building2,
  Route,
  Activity,
  Users,
  HeartPulse,
  ArrowRight,
  Satellite,
  Layers,
  MapPin,
  FileCheck2
} from 'lucide-react';
import type { AnalysisStatus } from '../services/api';

interface HomeViewProps {
  analysisStatus: AnalysisStatus | null;
  onNavigate: (tab: string) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  analysisStatus,
  onNavigate,
  onRunAnalysis,
  isAnalyzing,
}) => {
  const summary = analysisStatus?.summary;
  const infra = analysisStatus?.infrastructure;
  const access = analysisStatus?.accessibility;

  const floodHa = summary?.candidate_flood_area_hectares ?? 113.1;
  const buildingsAff = infra?.potentially_affected_buildings ?? 12;
  const roadsAffKm = infra?.potentially_affected_road_km ?? 2.28;
  const bridgesAff = infra?.potentially_affected_bridges ?? 0;
  const disconnectedCount = access?.disconnected_settlements_count ?? 4;
  const hospitalsImpacted = 1;

  return (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 text-slate-800">
      {/* Hero Banner with Himalayan Mountain Visual Aesthetic */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-gradient-to-r from-sky-900 via-blue-900 to-indigo-950 p-6 sm:p-10 lg:p-12 text-white">
        {/* Mountain Landscape Background Art (SVG vector topography) */}
        <div className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay">
          <svg className="w-full h-full object-cover" viewBox="0 0 1200 400" preserveAspectRatio="none">
            <path d="M0 280 L 150 180 L 280 240 L 450 120 L 620 220 L 780 140 L 950 250 L 1100 170 L 1200 230 L 1200 400 L 0 400 Z" fill="#ffffff" opacity="0.3" />
            <path d="M0 320 L 220 220 L 380 280 L 580 190 L 740 270 L 920 180 L 1080 260 L 1200 200 L 1200 400 L 0 400 Z" fill="#ffffff" opacity="0.5" />
          </svg>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Heading, Subtitle & CTAs */}
          <div className="lg:col-span-7 space-y-3.5">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              FloodScope AI
            </h1>

            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-blue-100">
              Satellite-Based Flood Damage & Rescue Intelligence
            </h2>

            <p className="text-xs sm:text-sm text-blue-200/90 max-w-xl leading-relaxed">
              Analyze flood impact, infrastructure damage, and accessibility using satellite data and AI.
            </p>

            <div className="pt-3 flex flex-wrap gap-3 items-center">
              <button
                type="button"
                onClick={() => {
                  onRunAnalysis();
                  onNavigate('map');
                }}
                disabled={isAnalyzing}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <span>{isAnalyzing ? 'Analyzing SAR Data...' : 'Run New Analysis'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('analysis')}
                className="px-5 py-2.5 bg-white/90 hover:bg-white text-slate-800 font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                View Demo
              </button>
            </div>
          </div>

          {/* Right Column: Track B Hackathon Card */}
          <div className="lg:col-span-5">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl space-y-4 text-white">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">Track B</span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Multimodal AI Hackathon 2026
                </h3>
              </div>

              <div className="space-y-3 pt-1 text-xs text-blue-100">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-white/15 text-cyan-300 shrink-0">
                    <Satellite className="w-4 h-4" />
                  </div>
                  <span>Real satellite data (Sentinel-1/2)</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-white/15 text-indigo-300 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span>Infrastructure impact analysis</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-white/15 text-rose-300 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span>Disconnected settlements</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-white/15 text-emerald-300 shrink-0">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <span>AI-generated situation reports</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Key Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1: Flooded Area */}
        <div
          onClick={() => onNavigate('analysis')}
          className="cursor-pointer bg-white border border-slate-200/90 hover:border-cyan-400 rounded-2xl p-4 shadow-xs hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Flooded Area (est.)</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 group-hover:scale-110 transition">
              <Waves className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {floodHa.toLocaleString()} <span className="text-xs font-sans text-slate-500 font-normal">ha</span>
          </div>
          <span className="text-[11px] text-cyan-600 font-medium block mt-1">~{(floodHa / 100).toFixed(1)} km² extent</span>
        </div>

        {/* Card 2: Buildings Affected */}
        <div
          onClick={() => onNavigate('infrastructure')}
          className="cursor-pointer bg-white border border-slate-200/90 hover:border-purple-400 rounded-2xl p-4 shadow-xs hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Buildings Affected</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {buildingsAff.toLocaleString()}
          </div>
          <span className="text-[11px] text-purple-600 font-medium block mt-1">Potentially affected</span>
        </div>

        {/* Card 3: Roads Affected */}
        <div
          onClick={() => onNavigate('infrastructure')}
          className="cursor-pointer bg-white border border-slate-200/90 hover:border-blue-400 rounded-2xl p-4 shadow-xs hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Roads Affected</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition">
              <Route className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {roadsAffKm} <span className="text-xs font-sans text-slate-500 font-normal">km</span>
          </div>
          <span className="text-[11px] text-blue-600 font-medium block mt-1">Candidate disruption</span>
        </div>

        {/* Card 4: Bridges at Risk */}
        <div
          onClick={() => onNavigate('infrastructure')}
          className="cursor-pointer bg-white border border-slate-200/90 hover:border-indigo-400 rounded-2xl p-4 shadow-xs hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Bridges at Risk</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {bridgesAff}
          </div>
          <span className="text-[11px] text-indigo-600 font-medium block mt-1">Within flood corridor</span>
        </div>

        {/* Card 5: Disconnected Settlements */}
        <div
          onClick={() => onNavigate('accessibility')}
          className="cursor-pointer bg-white border border-slate-200/90 hover:border-red-400 rounded-2xl p-4 shadow-xs hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Disconnected</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600 group-hover:scale-110 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-red-600 font-mono tracking-tight">
            {disconnectedCount}
          </div>
          <span className="text-[11px] text-red-600 font-medium block mt-1">Zero road link to clinic</span>
        </div>

        {/* Card 6: Hospitals Impacted */}
        <div
          onClick={() => onNavigate('accessibility')}
          className="cursor-pointer bg-white border border-slate-200/90 hover:border-rose-400 rounded-2xl p-4 shadow-xs hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Hospitals Impacted</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-110 transition">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {hospitalsImpacted}
          </div>
          <span className="text-[11px] text-rose-600 font-medium block mt-1">Hub accessibility down</span>
        </div>
      </div>

      {/* Last Analysis Callout Card */}
      <div
        onClick={() => onNavigate('map')}
        className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-4.5 flex flex-wrap items-center justify-between gap-4 transition shadow-xs group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Last Analysis</span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                COMPLETED
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              Bhote Koshi – Trishuli River Valley, Nepal
            </div>
            <div className="text-xs text-slate-500">
              Sentinel-1 IW SAR (Track 121) • Jul 20, 2026 → Aug 01, 2026
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 group-hover:text-blue-700">
          <span>Open Map Viewer</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
        </div>
      </div>
    </div>
  );
};
