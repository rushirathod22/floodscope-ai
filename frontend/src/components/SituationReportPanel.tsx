import React, { useState } from 'react';
import { X, Download, Sparkles, AlertCircle, BookOpen } from 'lucide-react';
import { api } from '../services/api';
import type { ReportResponse } from '../services/api';

interface SituationReportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  analysisId: string;
}

export const SituationReportPanel: React.FC<SituationReportPanelProps> = ({
  isOpen,
  onClose,
  analysisId,
}) => {
  const [language, setLanguage] = useState<'en' | 'ne'>('en');
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchReport = async (lang: 'en' | 'ne') => {
    setLoading(true);
    setLanguage(lang);
    try {
      const data = await api.generateReport(analysisId, lang);
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      fetchReport(language);
    }
  }, [isOpen, analysisId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                AI Disaster Situation Report Copilot
              </h3>
              <p className="text-xs text-slate-400">
                Evidence-grounded reporting strictly derived from validated Sentinel-1 & OSM analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switch */}
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => fetchReport('en')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  language === 'en' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => fetchReport('ne')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  language === 'ne' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                नेपाली (Nepali)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm">Synthesizing evidence-grounded situation report...</p>
            </div>
          ) : report ? (
            <>
              {/* Formatted Markdown Content */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-6 prose prose-invert max-w-none prose-headings:text-slate-100 prose-a:text-cyan-400 font-sans leading-relaxed whitespace-pre-line">
                {report.content_markdown}
              </div>

              {/* Citations & Limitations Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Uncertainties & Recommended Field Checks</span>
                  </div>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
                    {report.uncertainties_and_limitations.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Data Citations & Attributions</span>
                  </div>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
                    {report.citations.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-slate-500 py-10">No report generated yet.</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Report ID: <span className="font-mono text-slate-300">{report?.report_id || 'N/A'}</span>
          </div>

          <div className="flex items-center gap-3">
            {report && (
              <>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
                  title="Print or Save as 1-Page PDF"
                >
                  <span>🖨️ Print 1-Page SitRep</span>
                </button>
                <a
                  href={api.getReportDownloadUrl(report.report_id)}
                  download
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-cyan-600/20 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download (.md)</span>
                </a>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
