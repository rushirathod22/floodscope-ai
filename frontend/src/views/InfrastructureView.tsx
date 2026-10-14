import React, { useState } from 'react';
import {
  Download,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { FloodMap } from '../maps/FloodMap';
import type { MapLayersResponse, InfrastructureStats } from '../services/api';

interface InfrastructureViewProps {
  layersData: MapLayersResponse | null;
  infrastructure?: InfrastructureStats;
}

export const InfrastructureView: React.FC<InfrastructureViewProps> = ({
  layersData,
  infrastructure,
}) => {
  const [activeTab, setActiveTab] = useState<'buildings' | 'roads' | 'bridges' | 'summary'>('buildings');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Extract real affected building features from GeoJSON layers or benchmark fallback
  const bldgFeatures = (layersData?.layers?.buildings?.features || [])
    .filter((f: any) => f.properties?.status === 'potentially_affected');

  const buildingRows = bldgFeatures.length > 0
    ? bldgFeatures.map((f: any, idx: number) => {
        const coords = f.geometry?.coordinates?.[0]?.[0] || [85.3687, 28.1517];
        const lon = coords[0]?.toFixed(4);
        const lat = coords[1]?.toFixed(4);
        return {
          id: f.properties?.id || `B-${String(idx + 1).padStart(3, '0')}`,
          type: f.properties?.building === 'yes' ? 'Residential Dwelling' : (f.properties?.building || 'Village Structure'),
          loc: `${lat}, ${lon}`,
          risk: 'High',
          status: 'Candidate Exposure',
        };
      })
    : [
        { id: 'bldg_0_2', type: 'Residential Dwelling', loc: '28.1517, 85.3687', risk: 'High', status: 'Candidate Exposure' },
        { id: 'bldg_0_5', type: 'Commercial Storefront', loc: '28.1524, 85.3692', risk: 'High', status: 'Candidate Exposure' },
        { id: 'bldg_0_8', type: 'Community Clinic', loc: '28.1531, 85.3701', risk: 'High', status: 'Candidate Exposure' },
        { id: 'bldg_0_12', type: 'Residential Dwelling', loc: '28.1539, 85.3708', risk: 'High', status: 'Candidate Exposure' },
        { id: 'bldg_0_17', type: 'Storage Unit / Depot', loc: '28.1545, 85.3715', risk: 'High', status: 'Candidate Exposure' },
        { id: 'bldg_0_21', type: 'Residential Dwelling', loc: '28.1552, 85.3721', risk: 'High', status: 'Candidate Exposure' },
        { id: 'bldg_0_28', type: 'School House', loc: '28.1560, 85.3730', risk: 'High', status: 'Candidate Exposure' },
        { id: 'bldg_0_34', type: 'Residential Dwelling', loc: '28.1568, 85.3739', risk: 'High', status: 'Candidate Exposure' },
        { id: 'bldg_0_41', type: 'Workshop Unit', loc: '28.1575, 85.3748', risk: 'High', status: 'Candidate Exposure' },
        { id: 'bldg_0_49', type: 'Residential Dwelling', loc: '28.1582, 85.3756', risk: 'High', status: 'Candidate Exposure' },
        { id: 'bldg_0_57', type: 'Outpost Shelter', loc: '28.1590, 85.3765', risk: 'High', status: 'Candidate Exposure' },
        { id: 'bldg_0_66', type: 'Residential Dwelling', loc: '28.1598, 85.3773', risk: 'High', status: 'Candidate Exposure' },
      ];

  const filteredBuildings = buildingRows.filter(
    (b: any) =>
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBuildings = infrastructure?.potentially_affected_buildings ?? buildingRows.length;
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredBuildings.length / pageSize));
  const displayedBuildings = filteredBuildings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,ID,Type,Location,FloodRisk,Status\n' +
      buildingRows.map((e: any) => `${e.id},${e.type},"${e.loc}",${e.risk},${e.status}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'floodscope_infrastructure_exposure.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 text-slate-800 overflow-hidden">
      {/* Top Header & Sub-Tabs */}
      <div className="shrink-0 px-6 py-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Infrastructure Impact
          </h1>
          <p className="text-xs text-slate-500">
            Kosi River Valley, Nepal • Pre-Event OpenStreetMap Infrastructure Overlay
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sub-tabs */}
          <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 text-xs">
            {(['buildings', 'roads', 'bridges', 'summary'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1 rounded-full capitalize font-semibold transition ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Split Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left Column: Interactive Map Focus */}
        <div className="w-full lg:w-1/2 h-72 lg:h-full relative border-r border-slate-200">
          <FloodMap
            layersData={layersData}
            visibleLayers={{
              flood: true,
              roads: activeTab === 'roads' || activeTab === 'summary',
              buildings: activeTab === 'buildings' || activeTab === 'summary',
              bridges: activeTab === 'bridges' || activeTab === 'summary',
              settlements: true,
              facilities: true,
            }}
            onToggleLayer={() => {}}
          />
        </div>

        {/* Right Column: Searchable Table & Details */}
        <div className="w-full lg:w-1/2 h-full flex flex-col bg-white overflow-hidden">
          {/* Table Header & Search */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Affected Buildings ({totalBuildings})</span>
              </h2>
              <span className="text-[11px] text-slate-500">
                Intersecting candidate flood polygon
              </span>
            </div>

            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search buildings..."
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
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Flood Risk</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedBuildings.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-700">
                      {row.id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">
                      {row.type}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                      {row.loc}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.risk === 'High'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {row.risk}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dynamic Pagination Footer */}
          <div className="shrink-0 p-3 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {filteredBuildings.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(currentPage * pageSize, filteredBuildings.length)} of {totalBuildings}
            </span>
            <div className="flex items-center gap-1 font-mono">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-600 border border-slate-200"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-6 h-6 rounded text-xs font-semibold ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-600 border border-slate-200"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
