import React from 'react';
import { Satellite, RefreshCw, FileText, Info } from 'lucide-react';

interface HeaderProps {
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
  onOpenReport: () => void;
  onOpenProvenance: () => void;
  areaName: string;
}

export const Header: React.FC<HeaderProps> = ({
  isAnalyzing,
  onRunAnalysis,
  onOpenReport,
  onOpenProvenance,
  areaName,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 select-none">
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
          </div>
          <p className="text-xs text-slate-400">
            Automated Sentinel-1 SAR Flood Detection & Rescue Connectivity Intelligence
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex flex-col text-right pr-3 border-r border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Active Study Area</span>
          <span className="text-xs font-medium text-slate-200">{areaName}</span>
        </div>

        <button
          onClick={onOpenProvenance}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition"
          title="Data Provenance & Scientific Citations"
        >
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Data Citations</span>
        </button>

        <button
          onClick={onOpenReport}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 rounded-lg transition"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>Situation Report (AI)</span>
        </button>

        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md shadow-blue-600/30 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Processing Radar Data...' : 'Re-run Analysis'}</span>
        </button>
      </div>
    </header>
  );
};
