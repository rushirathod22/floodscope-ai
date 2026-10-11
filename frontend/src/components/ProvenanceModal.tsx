import React from 'react';
import { X, ShieldCheck, Database, CheckCircle2 } from 'lucide-react';

interface ProvenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProvenanceModal: React.FC<ProvenanceModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Data Provenance & Scientific Compliance
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 leading-relaxed">
          <div className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-emerald-300 text-sm">Hackathon Compliance Verified</h4>
              <p className="text-slate-300 text-xs mt-1">
                Sentinel-1 SAR scene comparison conforms to identical track and 12-day orbital cycle separation. Copernicus EMSR927 activation data is strictly retained for independent validation and NOT fed into detection models.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              Required Data Citations & Sources
            </h4>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
              <strong className="text-slate-200">1. Copernicus Sentinel-1 SAR (C-Band IW GRD):</strong>
              <p className="text-slate-400">
                Contains modified Copernicus Sentinel data (2024). Processed via dual-polarization (VH) backscatter calibration and Lee speckle filtering.
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
              <strong className="text-slate-200">2. Copernicus DEM GLO-30:</strong>
              <p className="text-slate-400">
                Copernicus Land Monitoring Service (CLMS) Global DEM 30m resolution. Slope thresholding (cut-off: 15°) prevents false-positive water classification from radar shadow in steep terrain.
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
              <strong className="text-slate-200">3. OpenStreetMap (OSM) Baseline:</strong>
              <p className="text-slate-400">
                Pre-event infrastructure snapshot © OpenStreetMap contributors (Open Database License - ODbL). Features: primary/secondary highways, rural access roads, suspension bridges, settlement centroids.
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
              <strong className="text-slate-200">4. UN-SPIDER Methodology Reference:</strong>
              <p className="text-slate-400">
                Radar-based Flood Mapping Recommended Practice (licensed under GNU AGPL v3.0). Referenced for backscatter histogram binarization (Otsu & minimum thresholding logic).
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-1">
            <span className="font-semibold text-amber-300">Analytical Distinction & Uncertainty Disclosure:</span>
            <p className="text-slate-400">
              Satellite backscatter decline reflects candidate surface water accumulation. Road intersection models candidate network disruption, not verified pavement destruction. Ground confirmation by first responders remains essential.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
