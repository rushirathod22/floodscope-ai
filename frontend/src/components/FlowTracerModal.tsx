import React, { useState } from 'react';
import { Mountain, Clock, ArrowDownRight, Compass, ShieldAlert, X } from 'lucide-react';
import { api } from '../services/api';
import type { TracePathResult } from '../services/api';

interface FlowTracerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPathTraced?: (pathGeoJson: any) => void;
}

export const FlowTracerModal: React.FC<FlowTracerModalProps> = ({ isOpen, onClose, onPathTraced }) => {
  const [startLat, setStartLat] = useState<number>(28.192);
  const [startLon, setStartLon] = useState<number>(85.352);
  const [velocityMs, setVelocityMs] = useState<number>(14.0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<TracePathResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunTracer = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.tracePath(startLat, startLon, velocityMs);
      setResult(res);
      if (onPathTraced && res.flow_path_geojson) {
        onPathTraced(res.flow_path_geojson);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to trace flow path from DEM.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Mountain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Upstream Valley Flow-Path Tracer
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                  BONUS AI ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Copernicus DEM 30m Steepest-Gradient D8 Hydro-Geomorphic Avalanche & Flood Propagation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Simulation Controls */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              Glacial Outburst / Avalanche Origin Coordinates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Glacier Latitude (°N)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={startLat}
                  onChange={(e) => setStartLat(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Glacier Longitude (°E)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={startLon}
                  onChange={(e) => setStartLon(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Wave Velocity (m/s)
                </label>
                <input
                  type="number"
                  step="1"
                  value={velocityMs}
                  onChange={(e) => setVelocityMs(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 items-center justify-between pt-3 border-t border-slate-800/60">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setStartLat(28.192); setStartLon(85.352); }}
                  className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
                >
                  📍 Preset: Upper Langtang Ridge
                </button>
                <button
                  type="button"
                  onClick={() => { setStartLat(28.185); setStartLon(85.365); }}
                  className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
                >
                  📍 Preset: Bhote Koshi Headwaters
                </button>
              </div>
              <button
                type="button"
                onClick={handleRunTracer}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 active:bg-amber-700 disabled:opacity-50 rounded-lg shadow-md transition flex items-center gap-2"
              >
                {isLoading ? 'Simulating DEM Flow Path...' : 'Trace Downhill Valley Path'}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-xs text-red-200">
              {error}
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-4">
              {/* Stats Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/50 border border-slate-800/70 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Path Length</div>
                  <div className="text-xl font-bold text-white font-mono mt-0.5">
                    {result.total_path_length_km} <span className="text-xs text-slate-400 font-sans">km</span>
                  </div>
                </div>
                <div className="bg-slate-950/50 border border-slate-800/70 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Vertical Drop</div>
                  <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">
                    {result.total_vertical_drop_m} <span className="text-xs text-slate-400 font-sans">m</span>
                  </div>
                </div>
                <div className="bg-slate-950/50 border border-slate-800/70 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Start Elevation</div>
                  <div className="text-xl font-bold text-cyan-400 font-mono mt-0.5">
                    {result.start_point.elevation_m} <span className="text-xs text-slate-400 font-sans">m</span>
                  </div>
                </div>
                <div className="bg-slate-950/50 border border-slate-800/70 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Downstream Towns</div>
                  <div className="text-xl font-bold text-red-400 font-mono mt-0.5">
                    {result.settlements_at_risk.length} <span className="text-xs text-slate-400 font-sans">villages</span>
                  </div>
                </div>
              </div>

              {/* Settlements at Risk List */}
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  Downstream Settlements in Direct Hazard Path (Arrival Timeline)
                </h4>

                {result.settlements_at_risk.length === 0 ? (
                  <p className="text-xs text-slate-400">No major monitored settlements directly within this path corridor.</p>
                ) : (
                  <div className="divide-y divide-slate-800/70">
                    {result.settlements_at_risk.map((s, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.risk_level === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' :
                            s.risk_level === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}>
                            {s.risk_level}
                          </span>
                          <div>
                            <span className="font-semibold text-white">{s.name}</span>
                            <span className="text-slate-400 text-[11px] ml-2 font-mono">
                              (Pop: {s.population.toLocaleString()})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <span className="text-slate-400 font-mono flex items-center gap-1">
                            <ArrowDownRight className="w-3.5 h-3.5 text-slate-500" />
                            {s.distance_downstream_km} km
                          </span>
                          <span className="text-amber-400 font-bold font-mono flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            ~{s.est_arrival_minutes} min arrival
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Based on Copernicus WorldDEM-30 GLO-30 elevation surface</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
