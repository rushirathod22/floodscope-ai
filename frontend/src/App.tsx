import { useState, useEffect } from 'react';
import { Navbar, type NavTab } from './components/Navbar';
import { HomeView } from './views/HomeView';
import { MapView } from './views/MapView';
import { AnalysisView } from './views/AnalysisView';
import { InfrastructureView } from './views/InfrastructureView';
import { AccessibilityView } from './views/AccessibilityView';
import { ReportsView } from './views/ReportsView';
import { FlowTracerModal } from './components/FlowTracerModal';
import { EMSR927Modal } from './components/EMSR927Modal';
import { CopilotChatDrawer } from './components/CopilotChatDrawer';
import { ProvenanceModal } from './components/ProvenanceModal';
import { api } from './services/api';
import type { AnalysisStatus, MapLayersResponse } from './services/api';
import { AlertCircle } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | null>(null);
  const [layersData, setLayersData] = useState<MapLayersResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modals & Drawers
  const [isFlowTracerOpen, setIsFlowTracerOpen] = useState<boolean>(false);
  const [isEMSR927Open, setIsEMSR927Open] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isProvenanceOpen, setIsProvenanceOpen] = useState<boolean>(false);

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

  const handleRunAnalysis = async (areaId?: string, preDate?: string, postDate?: string) => {
    try {
      setIsAnalyzing(true);
      setError(null);
      const newStatus = await api.runAnalysis({
        area_id: areaId === 'ulua_honduras' ? 'ulua_basin' : 'nepal_rasuwa',
        pre_event_date: preDate ? preDate.replace('2026', '2024') : '2024-08-14',
        post_event_date: postDate ? postDate.replace('2026', '2024') : '2024-08-26',
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
    <div className="flex flex-col h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Top Application Navbar with 6 Screen Tabs */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenFlowTracer={() => setIsFlowTracerOpen(true)}
        onOpenEMSR927={() => setIsEMSR927Open(true)}
        onRunAnalysis={handleRunAnalysis}
        isAnalyzing={isAnalyzing}
        dataSourceMode={analysisStatus?.data_source_mode || 'synthetic_demo'}
      />

      {/* Main Screen View Content */}
      <main className="flex-1 min-h-0 relative overflow-hidden bg-slate-50">
        {/* Error notification banner */}
        {error && (
          <div className="bg-red-950/90 border-b border-red-800 px-4 py-2 text-xs text-red-200 flex items-center justify-between z-40 relative">
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

        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-20 space-y-3">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-300">
              Loading Sentinel-1 SAR Georeferenced Layers...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView
                analysisStatus={analysisStatus}
                onNavigate={(tab) => setActiveTab(tab as NavTab)}
                onRunAnalysis={handleRunAnalysis}
                isAnalyzing={isAnalyzing}
              />
            )}

            {activeTab === 'map' && (
              <MapView
                layersData={layersData}
                onRunAnalysis={handleRunAnalysis}
                isAnalyzing={isAnalyzing}
                onOpenFlowTracer={() => setIsFlowTracerOpen(true)}
                onOpenEMSR927={() => setIsEMSR927Open(true)}
              />
            )}

            {activeTab === 'analysis' && (
              <AnalysisView
                analysisStatus={analysisStatus}
                onNavigate={(tab) => setActiveTab(tab as NavTab)}
                onOpenReport={() => setActiveTab('reports')}
              />
            )}

            {activeTab === 'infrastructure' && (
              <InfrastructureView
                layersData={layersData}
                infrastructure={analysisStatus?.infrastructure}
              />
            )}

            {activeTab === 'accessibility' && (
              <AccessibilityView
                layersData={layersData}
                accessibility={analysisStatus?.accessibility}
                onRunAnalysis={handleRunAnalysis}
                isAnalyzing={isAnalyzing}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView analysisStatus={analysisStatus} />
            )}
          </>
        )}
      </main>

      {/* Upstream Valley Flow-Path Tracer Modal (Bonus Feature) */}
      <FlowTracerModal
        isOpen={isFlowTracerOpen}
        onClose={() => setIsFlowTracerOpen(false)}
      />

      {/* Copernicus EMSR927 Validation Benchmark Modal */}
      <EMSR927Modal
        isOpen={isEMSR927Open}
        onClose={() => setIsEMSR927Open(false)}
        analysisId={analysisStatus?.analysis_id || 'latest'}
      />

      {/* Rescuer AI Copilot Chat Drawer */}
      <CopilotChatDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
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
