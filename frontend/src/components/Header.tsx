import React from 'react';
import { Satellite, RefreshCw, FileText, Info, Mountain, Award, Bot } from 'lucide-react';

interface HeaderProps {
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
  onOpenReport: () => void;
  onOpenProvenance: () => void;
  onOpenFlowTracer: () => void;
  onOpenEMSR927: () => void;
  onOpenCopilot: () => void;
  areaName: string;
  dataSourceMode?: string;
}

export const Header: React.FC<HeaderProps> = ({
  isAnalyzing,
  onRunAnalysis,
  onOpenReport,
  onOpenProvenance,
  onOpenFlowTracer,
  onOpenEMSR927,
  onOpenCopilot,
  areaName,
  dataSourceMode = 'synthetic_demo',
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-3 select-none">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
          <Satellite className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              FloodScope AI
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-full">
              SATELLITE INTEL v1.0
            </span>
            {dataSourceMode === 'synthetic_demo' ? (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800 rounded-full">
                ⚠️ SYNTHETIC BENCHMARK
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800 rounded-full">
                🛰️ REAL SATELLITE DATA
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Automated Sentinel-1 SAR Flood Detection & Rescue Connectivity • <span className="text-slate-300 font-medium">{areaName}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Bonus Feature Button */}
        <button
          onClick={onOpenFlowTracer}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/70 hover:bg-amber-900/80 border border-amber-700/80 rounded-lg shadow-sm transition"
          title="Trace uphill glacial outburst flood path down valley (Bonus)"
        >
          <Mountain className="w-3.5 h-3.5 text-amber-400" />
          <span>Flow Tracer (Bonus)</span>
        </button>

        {/* EMSR927 Benchmark Button */}
        <button
          onClick={onOpenEMSR927}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-300 bg-blue-950/70 hover:bg-blue-900/80 border border-blue-700/80 rounded-lg shadow-sm transition"
          title="Compare with Copernicus EMS Activation EMSR927"
        >
          <Award className="w-3.5 h-3.5 text-blue-400" />
          <span>EMSR927 Benchmark</span>
        </button>

        {/* Rescuer AI Copilot Button */}
        <button
          onClick={onOpenCopilot}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/80 rounded-lg shadow-sm transition"
          title="Open Rescuer Tactical AI Assistant"
        >
          <Bot className="w-3.5 h-3.5 text-emerald-400" />
          <span>Rescuer Copilot</span>
        </button>

        {/* Situation Report Button */}
        <button
          onClick={onOpenReport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-800/80 rounded-lg shadow-sm transition"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>SitRep (AI)</span>
        </button>

        <button
          onClick={onOpenProvenance}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
          title="Data Provenance & Scientific Citations"
        >
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Citations</span>
        </button>

        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md shadow-blue-600/30 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Processing...' : 'Re-run'}</span>
        </button>
      </div>
    </header>
  );
};
