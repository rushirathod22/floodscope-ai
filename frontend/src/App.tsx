import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { FloodMap } from './maps/FloodMap';
import { SituationReportPanel } from './components/SituationReportPanel';
import { ProvenanceModal } from './components/ProvenanceModal';
import { api } from './services/api';
import type { AnalysisStatus, MapLayersResponse } from './services/api';
import { AlertCircle } from 'lucide-react';

export function App() {
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | null>(null);
  const [layersData, setLayersData] = useState<MapLayersResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isProvenanceOpen, setIsProvenanceOpen] = useState<boolean>(false);

  // Map layer toggle states
  const [visibleLayers, setVisibleLayers] = useState({
    flood: true,
    roads: true,
    settlements: true,
    bridges: true,
    buildings: true,
    facilities: true,
  });

  const toggleLayer = (layerName: string) => {
    setVisibleLayers((prev: any) => ({
      ...prev,
      [layerName]: !prev[layerName],
    }));
  };

  const loadData = async (id: string = 'latest') => {
    try {
      setIsLoading(true);
      setError(null);
      const [status, layers] = await Promise.all([
        api.getAnalysis(id),
        api.getMapLayers(id),
      ]);
      setAnalysisStatus(status);
      setLayersData(layers);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to connect to backend service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      const newStatus = await api.runAnalysis({
        area_id: 'nepal_rasuwa',
        pre_event_date: '2024-08-14',
        post_event_date: '2024-08-26',
        relative_orbit: 121,
        polarization: 'VH',
        dem_slope_cutoff_deg: 15.0,
      });
      setAnalysisStatus(newStatus);
      const layers = await api.getMapLayers(newStatus.analysis_id);
      setLayersData(layers);
    } catch (err: any) {
      console.error('Error running analysis:', err);
      setError(err.message || 'Failed to complete radar analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Application Header */}
      <Header
        isAnalyzing={isAnalyzing}
        onRunAnalysis={handleRunAnalysis}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenProvenance={() => setIsProvenanceOpen(true)}
        areaName={analysisStatus?.area_name || 'Nepal Rasuwa District'}
        dataSourceMode={analysisStatus?.data_source_mode || 'synthetic_demo'}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Error notification banner */}
        {error && (
          <div className="bg-red-950/90 border-b border-red-800 px-4 py-2 text-xs text-red-200 flex items-center justify-between z-20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadData()}
              className="text-xs underline hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* Tactical Metrics Bar */}
        <div className="shrink-0 bg-slate-950/80 border-b border-slate-900 z-10">
          <StatsCards
            summary={analysisStatus?.summary}
            infrastructure={analysisStatus?.infrastructure}
            accessibility={analysisStatus?.accessibility}
          />
        </div>

        {/* Interactive Map View */}
        <div className="flex-1 relative min-h-0">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-20 space-y-3">
              <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-300">
                Loading Sentinel-1 SAR Georeferenced Layers...
              </p>
            </div>
          ) : (
            <FloodMap
              layersData={layersData}
              visibleLayers={visibleLayers}
              onToggleLayer={toggleLayer}
            />
          )}
        </div>
      </div>

      {/* AI Situation Report Dialog */}
      <SituationReportPanel
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        analysisId={analysisStatus?.analysis_id || 'latest'}
      />

      {/* Provenance & Citation Dialog */}
      <ProvenanceModal
        isOpen={isProvenanceOpen}
        onClose={() => setIsProvenanceOpen(false)}
      />
    </div>
  );
}

export default App;
