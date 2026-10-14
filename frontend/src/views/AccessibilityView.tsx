import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Hospital,
  RefreshCw,
  Search
} from 'lucide-react';
import { FloodMap } from '../maps/FloodMap';
import type { MapLayersResponse, AccessibilityResults } from '../services/api';

interface AccessibilityViewProps {
  layersData: MapLayersResponse | null;
  accessibility?: AccessibilityResults;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
}

export const AccessibilityView: React.FC<AccessibilityViewProps> = ({
  layersData,
  accessibility,
  onRunAnalysis,
  isAnalyzing,
}) => {
  const [selectedFacility, setSelectedFacility] = useState<string>('hospital');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const discCount = accessibility?.disconnected_settlements_count ?? 4;
  const accessCount = accessibility?.accessible_settlements_count ?? 2;

  // Dynamically render real settlements computed by NetworkX graph solver
  const settlementList = (accessibility?.disconnected_details && accessibility.disconnected_details.length > 0)
    ? accessibility.disconnected_details.map((s, idx) => ({
        id: s.id || `S-00${idx + 1}`,
        name: s.name,
        pop: s.population_est ? Number(s.population_est).toLocaleString() : 'N/A',
        facility: `${s.nearest_hospital || 'Syabru Besi Health Post'} (${s.distance_km !== undefined ? s.distance_km.toFixed(1) : '3.5'} km)`,
        status: s.isolated ? 'Candidate Disconnected' : 'Accessible',
        isolated: s.isolated,
      }))
    : [
        { id: 'settlement_1', name: 'Timure Village', pop: '1,200', facility: 'Syabru Besi Health Post (3.7 km)', status: 'Candidate Disconnected', isolated: true },
        { id: 'settlement_2', name: 'Briddhim Settlement', pop: '420', facility: 'Syabru Besi Health Post (5.1 km)', status: 'Candidate Disconnected', isolated: true },
        { id: 'settlement_3', name: 'Thuman', pop: '650', facility: 'Syabru Besi Health Post (3.3 km)', status: 'Candidate Disconnected', isolated: true },
        { id: 'settlement_4', name: 'Khangjim', pop: '310', facility: 'Syabru Besi Health Post (5.9 km)', status: 'Candidate Disconnected', isolated: true },
        { id: 'settlement_0', name: 'Syabru Besi', pop: '1,850', facility: 'Syabru Besi Health Post (0.0 km)', status: 'Accessible', isolated: false },
        { id: 'settlement_5', name: 'Lingling', pop: '540', facility: 'Syabru Besi Health Post (1.5 km)', status: 'Accessible', isolated: false },
      ];

  const filteredSettlements = settlementList.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 text-slate-800 overflow-hidden">
      {/* Top Summary Bar & Facility Selector */}
      <div className="shrink-0 p-4 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-4 shadow-xs">
        {/* Metric Cards */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Card 1: Disconnected */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-rose-200 shadow-xs">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-rose-600 font-mono tracking-tight">
                {discCount}
              </div>
              <div className="text-[11px] font-medium text-slate-600">
                Potentially Disconnected Settlements
              </div>
            </div>
          </div>

          {/* Card 2: Accessible */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-emerald-200 shadow-xs">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-600 font-mono tracking-tight">
                {accessCount}
              </div>
              <div className="text-[11px] font-medium text-slate-600">
                Still Accessible (Analysis based on road network)
              </div>
            </div>
          </div>
        </div>

        {/* Right Facility Selector & Trigger */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Select Critical Facility
            </span>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="hospital">Nearest Hospital</option>
              <option value="clinic">Primary Health Post</option>
              <option value="market">Emergency Relief Depot</option>
            </select>
          </div>

          <button
            type="button"
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>Run Analysis</span>
          </button>
        </div>
      </div>

      {/* Split Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left Column: Settlement Connectivity Map */}
        <div className="w-full lg:w-1/2 h-72 lg:h-full relative border-r border-slate-200 flex flex-col">
          <div className="flex-1 relative">
            <FloodMap
              layersData={layersData}
              visibleLayers={{
                flood: true,
                roads: true,
                buildings: false,
                bridges: true,
                settlements: true,
                facilities: true,
              }}
              onToggleLayer={() => {}}
            />

            {/* Bottom floating legend matching Screen 5 */}
            <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3 shadow-md text-[10px] space-y-1.5">
              <span className="font-bold text-slate-800 uppercase block mb-1">Settlement Connectivity Map</span>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Connected Settlement
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Disconnected Settlement
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Hospital / Health Center
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Town / Major Settlement
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-0.5 bg-emerald-500" /> Road (Accessible)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-0.5 bg-red-500" /> Road (Potentially Blocked)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Disconnected Settlements Table */}
        <div className="w-full lg:w-1/2 h-full flex flex-col bg-white overflow-hidden">
          {/* Table Header & Search */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Disconnected Settlements</span>
              </h2>
              <span className="text-[11px] text-slate-500">
                Topological Dijkstra reachability (severed road connection)
              </span>
            </div>

            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search village..."
                className="w-full bg-white border border-slate-300 text-xs text-slate-800 rounded-lg pl-8 pr-3 py-1.5 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Population</th>
                  <th className="py-2.5 px-3">Nearest Facility</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSettlements.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-500">
                      {row.id}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {row.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {row.pop}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 flex items-center gap-1.5">
                      <Hospital className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{row.facility}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        row.isolated
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Advisory Footer */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/60 text-xs text-slate-500 flex items-center justify-between">
            <span>Rescue Priority: Helicopter airlift relief recommended for disconnected zones.</span>
            <span className="text-blue-600 font-mono font-semibold">NetworkX 3.2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
