import React from 'react';
import {
  Satellite,
  Sun,
  Bot,
  Mountain,
  Award,
  RefreshCw,
} from 'lucide-react';

export type NavTab = 'home' | 'map' | 'analysis' | 'infrastructure' | 'accessibility' | 'reports';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenCopilot: () => void;
  onOpenFlowTracer: () => void;
  onOpenEMSR927: () => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  dataSourceMode?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenCopilot,
  onOpenFlowTracer,
  onOpenEMSR927,
  onRunAnalysis,
  isAnalyzing,
  dataSourceMode = 'synthetic_demo',
}) => {
  const navTabs: { id: NavTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'map', label: 'Map' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'infrastructure', label: 'Infrastructure' },
    { id: 'accessibility', label: 'Accessibility' },
    { id: 'reports', label: 'Reports' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none z-30 shadow-xs">
      {/* Left: Brand Logo & Title */}
      <div
        className="flex items-center gap-2.5 cursor-pointer group"
        onClick={() => onSelectTab('home')}
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition">
          <Satellite className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-slate-900 tracking-tight">
            FloodScope AI
          </span>
          {dataSourceMode === 'synthetic_demo' ? (
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
              Demo Benchmark
            </span>
          ) : (
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              Sentinel Live
            </span>
          )}
        </div>
      </div>

      {/* Center: Navigation Tabs */}
      <nav className="flex items-center bg-slate-100/80 p-1 rounded-full border border-slate-200/80">
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Right: Actions, AI Copilot, Bonus Tracer, Theme & Avatar */}
      <div className="flex items-center gap-2">
        {/* Bonus Tracer Button */}
        <button
          type="button"
          onClick={onOpenFlowTracer}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition"
          title="Upstream Valley Flow-Path Tracer (Bonus)"
        >
          <Mountain className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden xl:inline">Flow Tracer</span>
        </button>

        {/* EMSR927 Benchmark Button */}
        <button
          type="button"
          onClick={onOpenEMSR927}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
          title="Copernicus EMSR927 Validation Benchmark"
        >
          <Award className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden xl:inline">EMSR927</span>
        </button>

        {/* Rescuer Copilot Button */}
        <button
          type="button"
          onClick={onOpenCopilot}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
        >
          <Bot className="w-3.5 h-3.5 text-emerald-600" />
          <span>Rescuer Copilot</span>
        </button>

        {/* Re-run Analysis */}
        <button
          type="button"
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isAnalyzing ? 'Analyzing...' : 'Run Analysis'}</span>
        </button>

        {/* Sun / Theme icon */}
        <div className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer transition">
          <Sun className="w-4 h-4 text-amber-500" />
        </div>

        {/* User Profile Avatar */}
        <div className="w-8 h-8 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
          R
        </div>
      </div>
    </header>
  );
};
