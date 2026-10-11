import React from 'react';
import { Waves, Home, Route, Users, Compass } from 'lucide-react';
import type { FloodExtentSummary, InfrastructureStats, AccessibilityResults } from '../services/api';

interface StatsCardsProps {
  summary?: FloodExtentSummary;
  infrastructure?: InfrastructureStats;
  accessibility?: AccessibilityResults;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  summary,
  infrastructure,
  accessibility,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      {/* Flood Extent Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Flood Extent</span>
          <div className="p-2 bg-cyan-950/70 border border-cyan-800/60 rounded-lg text-cyan-400">
            <Waves className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">
            {summary?.candidate_flood_area_sq_km ?? 0}
          </span>
          <span className="text-xs font-medium text-slate-400">km²</span>
          <span className="text-xs text-cyan-400/90 font-mono ml-auto">
            ({summary?.candidate_flood_area_hectares ?? 0} ha)
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
          <span>AOI Analyzed: {summary?.total_area_analyzed_sq_km ?? 0} km²</span>
          <span className="text-emerald-400 flex items-center gap-1 font-mono">
            <Compass className="w-3 h-3" /> DEM Masked
          </span>
        </div>
      </div>

      {/* Buildings Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Affected Buildings</span>
          <div className="p-2 bg-rose-950/70 border border-rose-800/60 rounded-lg text-rose-400">
            <Home className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">
            {infrastructure?.potentially_affected_buildings ?? 0}
          </span>
          <span className="text-xs text-slate-400">/ {infrastructure?.total_buildings ?? 0} baseline</span>
        </div>
        <div className="mt-3 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span>Spatial Rule: Intersecting</span>
          <span className="text-rose-400/90 font-medium">Candidate Exposure</span>
        </div>
      </div>

      {/* Road Network Disruption Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Road Disruption</span>
          <div className="p-2 bg-amber-950/70 border border-amber-800/60 rounded-lg text-amber-400">
            <Route className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">
            {infrastructure?.potentially_affected_road_km ?? 0}
          </span>
          <span className="text-xs font-medium text-slate-400">km flooded</span>
          <span className="text-xs text-slate-500 ml-auto">
            of {infrastructure?.total_road_length_km ?? 0} km
          </span>
        </div>
        <div className="mt-3 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span>Bridges at Risk: {infrastructure?.potentially_affected_bridges ?? 0}</span>
          <span className="text-amber-400/90 font-medium">Graph Severed</span>
        </div>
      </div>

      {/* Disconnected Settlements Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-red-400">Isolated Settlements</span>
          <div className="p-2 bg-red-950/70 border border-red-800/60 rounded-lg text-red-400">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">
            {accessibility?.disconnected_settlements_count ?? 0}
          </span>
          <span className="text-xs text-slate-400">/ {accessibility?.total_settlements ?? 0} monitored</span>
          <span className="text-xs font-semibold text-red-400 bg-red-950 px-2 py-0.5 rounded-full border border-red-800 ml-auto">
            PRIORITY
          </span>
        </div>
        <div className="mt-3 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span>NetworkX Graph Model</span>
          <span className="text-emerald-400">{accessibility?.accessible_settlements_count ?? 0} Connected</span>
        </div>
      </div>
    </div>
  );
};
