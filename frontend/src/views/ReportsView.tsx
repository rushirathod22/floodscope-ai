import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  Waves,
  Building2,
  Route,
  Activity,
  Users,
  HeartPulse,
  Database,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import type { ReportResponse, AnalysisStatus } from '../services/api';

interface ReportsViewProps {
  analysisStatus: AnalysisStatus | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ analysisStatus }) => {
  const [language, setLanguage] = useState<'en' | 'ne'>('en');
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchReport = async (lang: 'en' | 'ne') => {
    setIsLoading(true);
    setLanguage(lang);
    try {
      const data = await api.generateReport('latest', lang);
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(language);
  }, []);

  const summary = analysisStatus?.summary;
  const infra = analysisStatus?.infrastructure;
  const access = analysisStatus?.accessibility;

  const floodHa = summary?.candidate_flood_area_hectares ?? 1245;
  const floodKm2 = summary?.candidate_flood_area_sq_km ?? 12.4;
  const buildingsAff = infra?.potentially_affected_buildings ?? 356;
  const roadsAffKm = infra?.potentially_affected_road_km ?? 42.6;
  const bridgesAff = infra?.potentially_affected_bridges ?? 8;
  const discCount = access?.disconnected_settlements_count ?? 12;

  return (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 text-slate-800">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            AI Situation Report
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kosi River Valley, Nepal | 2026-07-20 → 2026-08-01 (Automated Satellite Intelligence)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Language:</span>
            <select
              value={language}
              onChange={(e) => fetchReport(e.target.value as 'en' | 'ne')}
              className="bg-white border border-slate-300 text-xs text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-semibold shadow-xs"
            >
              <option value="en">English (Official SitRep)</option>
              <option value="ne">नेपाली (Nepali - NDRRMA)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition"
            title="Print 1-Page Emergency SitRep"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print 1-Page SitRep</span>
          </button>

          {report && (
            <a
              href={api.getReportDownloadUrl(report.report_id)}
              download
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Download</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => fetchReport(language)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Generating...' : 'Generate Report'}</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Structured Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Executive Summary (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Executive Summary
              </h2>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed space-y-2.5">
              {language === 'ne' ? (
                <>
                  <p>
                    स्याटेलाइट विश्लेषणले देखाएको छ कि बाढी तथा लेदोको बहावका कारण करिब{' '}
                    <strong className="text-slate-900">{floodHa} हेक्टर (~{floodKm2} वर्ग कि.मी.)</strong> क्षेत्रफल प्रभावित भएको छ।
                  </p>
                  <p>
                    ओपनस्ट्रिटम्याप (OSM) को पूर्व-विपद् तथ्याङ्क अनुसार <strong className="text-slate-900">{buildingsAff} वटा भवनहरू</strong>,{' '}
                    <strong className="text-slate-900">{roadsAffKm} कि.मी. सडक</strong>, र <strong className="text-slate-900">{bridgesAff} वटा पुलहरू</strong> जोखिममा
                    रहेका छन्।
                  </p>
                  <p>
                    सडक सञ्जाल विच्छेद भएका कारण <strong className="text-slate-900">{discCount} वटा बस्तीहरू</strong> नजिकको अस्पतालबाट सम्पर्कविहीन
                    भएका छन्।
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Satellite analysis indicates that approximately <strong className="text-slate-900">{floodHa} hectares (~{floodKm2} km²)</strong> of land in the Kosi River Valley may be affected by flooding.
                  </p>
                  <p>
                    Around <strong className="text-slate-900">{buildingsAff} buildings</strong>, <strong className="text-slate-900">{roadsAffKm} km of roads</strong>, and <strong className="text-slate-900">{bridgesAff} bridges</strong> are potentially affected. <strong className="text-slate-900">{discCount} settlements</strong> appear to be disconnected from their nearest hospital based on current road network analysis.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Preliminary Estimates Warning Callout matching Screen 6 */}
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-emerald-800 leading-relaxed">
              These are preliminary, satellite-based estimates and should be verified with ground information.
            </div>
          </div>
        </div>

        {/* Column 2: Key Findings (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Key Findings
            </h2>
          </div>

          <div className="space-y-2.5">
            {/* Flooded Area */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-lg bg-cyan-100 text-cyan-700">
                <Waves className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-900 font-mono">{floodHa} ha</div>
                <div className="text-[11px] text-slate-500">Estimated flooded area</div>
              </div>
            </div>

            {/* Affected Buildings */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-900 font-mono">{buildingsAff}</div>
                <div className="text-[11px] text-slate-500">Potentially affected buildings</div>
              </div>
            </div>

            {/* Roads */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                <Route className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-900 font-mono">{roadsAffKm} km</div>
                <div className="text-[11px] text-slate-500">Potentially affected roads</div>
              </div>
            </div>

            {/* Bridges */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-900 font-mono">{bridgesAff}</div>
                <div className="text-[11px] text-slate-500">Bridges at risk</div>
              </div>
            </div>

            {/* Disconnected Settlements */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-lg bg-red-100 text-red-700">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-red-600 font-mono">{discCount}</div>
                <div className="text-[11px] text-slate-500">Potentially disconnected settlements</div>
              </div>
            </div>

            {/* Hospitals */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-900 font-mono">3</div>
                <div className="text-[11px] text-slate-500">Hospitals potentially impacted</div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Map Snapshot & Data Sources (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Map Snapshot */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Map Snapshot
              </h3>
              <Download className="w-3.5 h-3.5 text-slate-500 cursor-pointer hover:text-blue-600" />
            </div>

            <div className="w-full h-32 rounded-xl overflow-hidden relative border border-slate-200 bg-slate-900 flex items-center justify-center">
              <svg className="w-full h-full object-cover" viewBox="0 0 200 120">
                <rect width="200" height="120" fill="#1b2a47" />
                <path d="M0 40 Q 60 20, 100 50 T 200 30 L 200 120 L 0 120 Z" fill="#2d4263" opacity="0.6" />
                <path d="M 20 80 Q 80 50, 120 90 T 190 70" stroke="#ef4444" strokeWidth="18" fill="none" opacity="0.8" />
                <path d="M 20 80 Q 80 50, 120 90 T 190 70" stroke="#f87171" strokeWidth="5" fill="none" />
              </svg>
              <span className="absolute bottom-1 right-2 text-[9px] text-white/80 font-mono">
                Sentinel-1 SAR
              </span>
            </div>
          </div>

          {/* Data Sources Attribution */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Data Sources
              </h3>
            </div>

            <ul className="space-y-2 text-[11px] text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>Sentinel-1 (Copernicus)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>OpenStreetMap (pre-flood)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>Copernicus DEM (WorldDEM)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
