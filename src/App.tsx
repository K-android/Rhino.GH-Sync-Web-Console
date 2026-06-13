/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import ThreeCanvas from './components/ThreeCanvas';
import ParamsSidebar from './components/ParamsSidebar';
import GrasshopperGraph from './components/GrasshopperGraph';
import CodeViewer from './components/CodeViewer';
import TelemetryChart from './components/TelemetryChart';
import GuideModal from './components/GuideModal';
import {
  ModelType,
  AnalysisType,
  FacadeParams,
  CanopyParams,
  BridgeParams,
  ComputeResponse,
  ConsoleLog
} from './types';
import { Hammer, Terminal, Wifi, Cloud, ExternalLink, Moon, HelpCircle } from 'lucide-react';

export default function App() {
  // 1. Core States matching Hops sliders
  const [analysisType, setAnalysisType] = useState<AnalysisType>('solar');
  const [sunAngle, setSunAngle] = useState<number>(45);

  // 1. Core Configurator Params for direct grasshopper link
  const [configuratorParams, setConfiguratorParams] = useState<ConfiguratorParams>({
    rotationAngle: 45.0,
    offsetDistance: 2.0,
    populationCount: 10,
    maxExtrudeZ: 10.0,
    minExtrudeZ: 2.0,
    maxMoveZ: 5.0,
    minMoveZ: 0.0,
    maxXSize: 10.0,
    maxYSize: 10.0
  });

  // Response solutions from Express /api/compute (the simulated Grasshopper solver)
  const [apiResponse, setApiResponse] = useState<ComputeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Bottom terminal logs list
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([
    {
      timestamp: formatTime(new Date()),
      level: 'success',
      message: 'Console established. Connected to headless Rhino.Compute node pipeline.'
    }
  ]);

  const [activeTab, setActiveTab] = useState<'graph' | 'json' | 'perf' | 'logs'>('graph');

  // 3. User Layout Resizing States
  const [sidebarWidth, setSidebarWidth] = useState<number>(350);
  const [devPanelHeight, setDevPanelHeight] = useState<number>(280);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<'sidebar' | 'panel' | null>(null);
  const [isViewportExpanded, setIsViewportExpanded] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);

  const isDraggingSidebar = useRef<boolean>(false);
  const isDraggingDevPanel = useRef<boolean>(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingSidebar.current) {
        const newWidth = Math.max(240, Math.min(600, e.clientX));
        setSidebarWidth(newWidth);
      } else if (isDraggingDevPanel.current) {
        const windowHeight = window.innerHeight;
        // The bottom panel's height is precisely the distance from the bottom of the window to the cursor
        const newHeight = Math.max(160, Math.min(windowHeight - 200, windowHeight - e.clientY));
        setDevPanelHeight(newHeight);
      }
    };

    const handleGlobalMouseUp = () => {
      isDraggingSidebar.current = false;
      isDraggingDevPanel.current = false;
      setIsResizing(null);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const handleSidebarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingSidebar.current = true;
    setIsResizing('sidebar');
  };

  const handleDevPanelMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingDevPanel.current = true;
    setIsResizing('panel');
  };

  // Multi-render throttling/debouncing to prevent Express server thrashing during active dragging
  const prevParamsRef = useRef<string>('');

  // 2. Fetch parametric solution from our backend / Rhino
  const triggerCompute = async (isManual = false) => {
    // Collect active params for Rhino Compute Grasshopper endpoint
    const payload = {
      pointer: "C:/Users/User/Desktop/web-configurator.gh", // specific to the user's setup
      values: [
        { ParamName: "RotationAngle", InnerTree: { "{0}": [{ data: configuratorParams.rotationAngle }] } },
        { ParamName: "OffsetDistance", InnerTree: { "{0}": [{ data: configuratorParams.offsetDistance }] } },
        { ParamName: "PopulationCount", InnerTree: { "{0}": [{ data: configuratorParams.populationCount }] } },
        { ParamName: "MaxExtrudeZ", InnerTree: { "{0}": [{ data: configuratorParams.maxExtrudeZ }] } },
        { ParamName: "MinExtrudeZ", InnerTree: { "{0}": [{ data: configuratorParams.minExtrudeZ }] } },
        { ParamName: "MaxMoveZ", InnerTree: { "{0}": [{ data: configuratorParams.maxMoveZ }] } },
        { ParamName: "MinMoveZ", InnerTree: { "{0}": [{ data: configuratorParams.minMoveZ }] } },
        { ParamName: "MaxXSize", InnerTree: { "{0}": [{ data: configuratorParams.maxXSize }] } },
        { ParamName: "MaxYSize", InnerTree: { "{0}": [{ data: configuratorParams.maxYSize }] } }
      ]
    };

    const payloadString = JSON.stringify(payload);
    if (payloadString === prevParamsRef.current && !isManual) return; // avoid duplicate calls
    prevParamsRef.current = payloadString;

    setLoading(true);
    const startRequest = performance.now();

    // Log the packet sending
    const logParams = `rot=${configuratorParams.rotationAngle}, off=${configuratorParams.offsetDistance}, pop=${configuratorParams.populationCount}, mxZ=${configuratorParams.maxExtrudeZ}, mnZ=${configuratorParams.minExtrudeZ}, mxMz=${configuratorParams.maxMoveZ}, mnMz=${configuratorParams.minMoveZ}, mxX=${configuratorParams.maxXSize}, mxY=${configuratorParams.maxYSize}`;

    addLog('info', `POST /grasshopper sending array payload for web-configurator.gh`);

    try {
      let targetUrl = import.meta.env.VITE_RHINO_COMPUTE_URL || 'https://ruckus-ominous-delicious.ngrok-free.dev';
      
      // Ensure we hit the grasshopper endpoint if using external Rhino Compute
      if (targetUrl.startsWith('http')) {
        // Strip trailing slash if present, then append '/grasshopper' if it's not already there
        targetUrl = targetUrl.replace(/\/$/, '');
        if (!targetUrl.endsWith('/grasshopper') && !targetUrl.endsWith('/api/compute')) {
          targetUrl += '/grasshopper';
        }
      } else {
        targetUrl = '/api/compute';
      }

      const isExternal = targetUrl.startsWith('http');
      
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: payloadString
      });

      if (!response.ok) {
        if (response.status === 404 && isExternal) {
          throw new Error(`Connected to ngrok, but Rhino.Compute threw a 404 Not Found at '/api/compute'. Rhino expects '/grasshopper' with a valid .gh script!`);
        }
        throw new Error(`Rhino.Compute Proxy returned ${response.status}`);
      }

      const resData = (await response.json()) as ComputeResponse;
      const durationSum = performance.now() - startRequest;

      setApiResponse(resData);
      
      addLog(
        'success',
        `Response 200 Received: Generated ${resData.data.mesh.vertices.length / 3} vertices in ${resData.solverTimeMs}ms (Network RTT: ${durationSum.toFixed(0)}ms)`
      );
    } catch (err: any) {
      console.error(err);
      
      let errorMessage = err?.message || err;
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = `Failed to fetch. This usually means either: 
1. The Vercel Env Var isn't prefixed with "VITE_" so it's missing.
2. CORS failed because you hit the ngrok URL but Rhino Compute doesn't know the '/api/compute' path. 
(Real Rhino expects '/grasshopper' and 'rhino3dm.js' integration)`;
      }
      
      addLog('error', `Grasshopper computation failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Trigger whenever sliders change
  useEffect(() => {
    // Quick timer / debounce to prevent spamming server while sliding fast
    const delayDebounce = setTimeout(() => {
      triggerCompute();
    }, 45); // highly responsive 45ms debounce

    return () => clearTimeout(delayDebounce);
  }, [sunAngle, configuratorParams]);

  // Terminal logging helper
  const addLog = (level: 'info' | 'success' | 'warning' | 'error', message: string) => {
    const newLog: ConsoleLog = {
      timestamp: formatTime(new Date()),
      level,
      message
    };
    setConsoleLogs((prev) => [newLog, ...prev].slice(0, 50)); // limit to 50 logs
  };

  const getActiveSlidersMap = (): Record<string, number> => {
    const res: Record<string, number> = { sunAngle };
    Object.entries(configuratorParams).forEach(([k, v]) => res[k] = v as number);
    return res;
  };

  return (
    <div className={`min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans ${isResizing ? 'select-none' : ''}`} id="rhino_compute_dashboard">
      {/* 1. SEAMLESS EVENT CAPTURING BACKDROP FOR DRAGGING */}
      {isResizing && (
        <div 
          className="fixed inset-0 z-[9999] opacity-0 select-none pointer-events-auto"
          style={{ cursor: isResizing === 'sidebar' ? 'col-resize' : 'row-resize' }}
        />
      )}

      {/* 1. PROFESSIONAL CAD HEADER BAR */}
      <header className="border-b border-zinc-900 bg-zinc-900/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400 animate-pulse">
            <Hammer className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
              Rhino.Compute Web Console
            </h1>
            <p className="text-[11px] text-zinc-400 font-medium">
              Real-time Grasshopper solver loops via headless virtual machine
            </p>
          </div>
        </div>

        {/* Server & connection state */}
        <div className="flex items-center gap-4">
          {/* Guide Button */}
          <button 
            onClick={() => setIsGuideModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-medium transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Integration Guide</span>
          </button>

          {/* Socket Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-zinc-950 border border-zinc-900 rounded-full text-[11px] font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-zinc-300">CLOUD NODE STATUS:</span>
            <span className="text-emerald-400 font-bold uppercase flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 inline" />
              Active (Hops Port 3000)
            </span>
          </div>

          {/* User Email Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
            <Cloud className="w-3.5 h-3.5 text-zinc-500" />
            <span>ID: fc9f1861</span>
          </div>
        </div>
      </header>

      {/* Guide Modal Overlay */}
      <GuideModal 
        isOpen={isGuideModalOpen} 
        onClose={() => setIsGuideModalOpen(false)} 
      />

      {/* 2. CORE WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden lg:h-[calc(100vh-65px)] h-auto custom-scrollbar">
        
        {/* Left Side: Control sliders list */}
        {!isViewportExpanded && (
          <aside 
            style={isDesktop ? { width: `${sidebarWidth}px`, flexShrink: 0 } : {}}
            className="w-full shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-900 bg-zinc-900/30 p-4 overflow-visible lg:overflow-auto h-auto lg:h-full select-none"
          >
            <ParamsSidebar
              analysisType={analysisType}
              setAnalysisType={setAnalysisType}
              configuratorParams={configuratorParams}
              setConfiguratorParams={setConfiguratorParams}
              sunAngle={sunAngle}
              setSunAngle={setSunAngle}
            />
          </aside>
        )}

        {/* Vertical Resizer Handle */}
        {isDesktop && !isViewportExpanded && (
          <div
            onMouseDown={handleSidebarMouseDown}
            className="hidden lg:block w-3 bg-transparent cursor-col-resize h-full shrink-0 z-30 transition-all group relative -mx-1.5"
            title="Drag to resize sidebar"
          >
            {/* Visual indicator line inside */}
            <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1.5px] h-full transition-colors duration-150 ${isResizing === 'sidebar' ? 'bg-sky-400' : 'bg-zinc-800 group-hover:bg-sky-400/80'}`}></div>
          </div>
        )}

        {/* Center: Split View (3D viewport at top, developer monitors at bottom) */}
        <main className="flex-1 flex flex-col overflow-visible lg:overflow-hidden min-w-0 lg:h-full">
          
          {/* Top Panel: Gorgeous 3D graphics Canvas */}
          <section className={`flex-1 min-h-0 relative flex flex-col transition-all duration-300 ${isViewportExpanded ? 'p-0 h-[calc(100vh-65px)] lg:h-full' : 'h-[320px] sm:h-[400px] lg:h-0 lg:flex-1 min-h-[240px] lg:min-h-0 p-4'}`} id="three_stage">
            <ThreeCanvas
              meshData={apiResponse ? apiResponse.data.mesh : null}
              lineData={apiResponse ? apiResponse.data.lines : undefined}
              sunAngle={sunAngle}
              loading={loading}
              modelType={'configurator' as any}
              analysisType={analysisType}
              isViewportExpanded={isViewportExpanded}
              onToggleViewportExpanded={() => setIsViewportExpanded(!isViewportExpanded)}
            />
          </section>

          {/* Horizontal Resizer Handle */}
          {isDesktop && !isViewportExpanded && (
            <div
              onMouseDown={handleDevPanelMouseDown}
              className="hidden lg:block h-3 bg-transparent cursor-row-resize w-full shrink-0 z-30 transition-all group relative -my-1.5"
              title="Drag to resize panel"
            >
              {/* Visual indicator line inside */}
              <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.5px] w-full transition-colors duration-150 ${isResizing === 'panel' ? 'bg-sky-400' : 'bg-zinc-800 group-hover:bg-sky-400/80'}`}></div>
            </div>
          )}

          {/* Bottom Panel: Developer analysis control dashboard (Tabbed View) */}
          {!isViewportExpanded && (
            <section 
              style={isDesktop ? { height: `${devPanelHeight}px` } : {}}
              className="relative border-t border-zinc-900 bg-zinc-900 p-4 pt-5 flex flex-col overflow-hidden z-20 shrink-0"
            >
            {/* Developer tabs header selection */}
            <div className="flex items-center justify-between border-b border-zinc-850 pb-2 mb-3">
              <div className="flex gap-1.5" id="developer_tabs">
                <button
                  onClick={() => setActiveTab('graph')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
                    activeTab === 'graph'
                      ? 'bg-sky-500/10 border border-sky-500/40 text-sky-400'
                      : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                  }`}
                  id="tab_gh_graph"
                >
                  Grasshopper Graph
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
                    activeTab === 'json'
                      ? 'bg-sky-500/10 border border-sky-500/40 text-sky-400'
                      : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                  }`}
                  id="tab_json_exchange"
                >
                  REST JSON Exchange
                </button>
                <button
                  onClick={() => setActiveTab('perf')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
                    activeTab === 'perf'
                      ? 'bg-sky-500/10 border border-sky-500/40 text-sky-400'
                      : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                  }`}
                  id="tab_telemetry"
                >
                  Node Profiler
                </button>
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 relative ${
                    activeTab === 'logs'
                      ? 'bg-sky-500/10 border border-sky-500/40 text-sky-400'
                      : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                  }`}
                  id="tab_console_logs"
                >
                  Live Logs
                </button>
              </div>

              {/* Network active info */}
              <div className="flex items-center gap-1.5 text-[9.5px] font-mono text-zinc-500">
                <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                <span>Routines monitoring active</span>
              </div>
            </div>

            {/* Tabbed view frames rendering */}
            <div className="flex-1 overflow-hidden" id="developer_tab_contents">
              {activeTab === 'graph' && (
                <GrasshopperGraph
                  modelType={'configurator' as any}
                  params={getActiveSlidersMap()}
                  telemetry={apiResponse ? apiResponse.data.telemetry.nodes : undefined}
                  solverTimeMs={apiResponse ? apiResponse.solverTimeMs : 0}
                />
              )}

              {activeTab === 'json' && (
                <CodeViewer
                  apiResponse={apiResponse}
                  loading={loading}
                />
              )}

              {activeTab === 'perf' && (
                <TelemetryChart
                  telemetry={apiResponse ? apiResponse.data.telemetry.nodes : undefined}
                  modelType={'configurator' as any}
                  solverTimeMs={apiResponse ? apiResponse.solverTimeMs : 0}
                />
              )}

              {activeTab === 'logs' && (
                <div className="w-full h-full bg-zinc-950 border border-zinc-900 rounded-xl p-3 flex flex-col font-mono text-[11px] overflow-hidden">
                  <div className="flex items-center justify-between text-zinc-500 border-b border-zinc-950 pb-1.5 mb-1.5 shrink-0 select-none">
                    <span>TRANSACTION EVENT LOG STREAM</span>
                    <span>HTTPS 1.1 SSL LOOP</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar flex flex-col-reverse text-[10.5px]">
                    {consoleLogs.map((log, index) => (
                      <div key={index} className="flex select-all py-0.5 border-b border-zinc-900/20">
                        <span className="text-zinc-600 shrink-0 mr-2.5">[{log.timestamp}]</span>
                        <span className={`font-semibold shrink-0 mr-1.5 uppercase ${getLogColor(log.level)}`}>
                          {log.level}:
                        </span>
                        <span className="text-zinc-300 break-all">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
      </div>
    </div>
  );
}

// Simple time formatter helpers
function formatTime(d: Date): string {
  const parts = [
    d.getHours().toString().padStart(2, '0'),
    d.getMinutes().toString().padStart(2, '0'),
    d.getSeconds().toString().padStart(2, '0')
  ];
  return parts.join(':') + '.' + d.getMilliseconds().toString().padStart(3, '0');
}

function getLogColor(level: 'info' | 'success' | 'warning' | 'error'): string {
  switch (level) {
    case 'info': return 'text-sky-400';
    case 'success': return 'text-emerald-400';
    case 'warning': return 'text-amber-400 tracking-wide';
    case 'error': return 'text-rose-400 font-bold';
  }
}
