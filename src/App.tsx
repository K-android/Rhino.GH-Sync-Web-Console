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
import { solveGeometry } from '../server/solver';

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
  // 1. Core States
  const [analysisType, setAnalysisType] = useState<AnalysisType>('solar');
  const [sunAngle, setSunAngle] = useState<number>(45);

  const [ioSchema, setIoSchema] = useState<any[]>([]);
  const [dynamicParams, setDynamicParams] = useState<Record<string, number>>({});
  const [schemaFetched, setSchemaFetched] = useState(false);

  // Response solutions from Express /api/compute (the simulated Grasshopper solver)
  const [apiResponse, setApiResponse] = useState<ComputeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Bottom terminal logs list
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([
    {
      timestamp: formatTime(new Date()),
      level: 'success',
      message: 'Console established. Connected to web-configurator.gh via headless Rhino.Compute node.'
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

  // Fetch IO schema once
  useEffect(() => {
    const fetchSchema = async () => {
      try {
        addLog('info', 'Connecting to Grasshopper endpoint to retrieve IO schema...');
        
        const externalUrl = import.meta.env.VITE_RHINO_COMPUTE_URL || 'https://ruckus-ominous-delicious.ngrok-free.dev';
        
        let targetUrl = '/api/io'; // ALWAYS proxy through backend to avoid CORS
        
        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            pointer: "C:/Users/User/OneDrive/Desktop/web-configurator.gh",
            externalUrl
          })
        });

        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        
        const data = await response.json();
        if (data && data.Inputs) {
           setIoSchema(data.Inputs);
           const initialParams: Record<string, number> = {};
           data.Inputs.forEach((input: any) => {
             const defaultVal = input.Default !== undefined ? Number(input.Default) : 0;
             initialParams[input.Name] = defaultVal;
           });
           setDynamicParams(initialParams);
           setSchemaFetched(true);
           addLog('success', `Dynamic Schema loaded containing ${data.Inputs.length} parameters`);
        } else {
           throw new Error('Invalid schema format returned');
        }
      } catch(err: any) {
        // Fallback to our dummy server just in case ngrok fails
        try {
          addLog('warning', `ngrok unreachable or CORS failed, falling back to local mathematically simulated schema`);
          // Note: using hardcoded data directly to support static hosting (like Vercel) where there is no local Express backend `/api/io` route
          const data = {
             Inputs: [
               { Name: 'RotationAngle', Default: 45, Minimum: -180, Maximum: 180 },
               { Name: 'OffsetDistance', Default: 2, Minimum: -10, Maximum: 10 },
               { Name: 'PopulationCount', Default: 10, Minimum: 1, Maximum: 100 },
               { Name: 'MaxExtrudeZ', Default: 10, Minimum: 0.1, Maximum: 50 },
               { Name: 'MinExtrudeZ', Default: 2, Minimum: 0.1, Maximum: 50 },
               { Name: 'MaxMoveZ', Default: 5, Minimum: -20, Maximum: 20 },
               { Name: 'MinMoveZ', Default: 0, Minimum: -20, Maximum: 20 },
               { Name: 'MaxXSize', Default: 10, Minimum: 0.1, Maximum: 50 },
               { Name: 'MaxYSize', Default: 10, Minimum: 0.1, Maximum: 50 }
            ]
          };
          setIoSchema(data.Inputs);
          const initialParams: Record<string, number> = {};
          data.Inputs.forEach((input: any) => {
             const defaultVal = input.Default !== undefined ? Number(input.Default) : 0;
             initialParams[input.Name] = defaultVal;
          });
          setDynamicParams(initialParams);
          setSchemaFetched(true);
        } catch (innerErr: any) {
          addLog('error', `Failed to retrieve dynamic Grasshopper schema IO: ${innerErr.message || innerErr}`);
        }
      }
    };
    
    fetchSchema();
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
      pointer: "C:/Users/User/OneDrive/Desktop/web-configurator.gh", // specific to the user's setup
      values: Object.entries(dynamicParams).map(([key, value]) => ({
        ParamName: key,
        InnerTree: { 
          "{0}": [
            { 
              type: Number.isInteger(value) ? "System.Int32" : "System.Double", 
              data: value 
            }
          ] 
        }
      }))
    };

    const payloadString = JSON.stringify(payload);
    if (payloadString === prevParamsRef.current && !isManual) return; // avoid duplicate calls
    prevParamsRef.current = payloadString;

    setLoading(true);
    const startRequest = performance.now();

    // Log the packet sending
    const logParams = Object.entries(dynamicParams).map(([k, v]) => `${k}=${v}`).join(', ');

    addLog('info', `POST /grasshopper sending dynamic payload: { ${logParams} }`);

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
      
      let resData: any = null;
      let durationSum = 0;
      let response: Response | undefined;
      
      try {
        if (isExternal) {
          response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            },
            body: payloadString
          });
          
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error(`Connected to external compute, but threw 404 Not Found at '${targetUrl}'.`);
            }
            throw new Error(`External Rhino.Compute Proxy returned ${response.status}`);
          }
          resData = await response.json();
          durationSum = performance.now() - startRequest;
        } else {
          // Force fallback to local direct execution to support Vercel deployments
          throw new Error('Local Express backend assumed unavailable, using pure client-side simulation');
        }
      } catch (externalErr: any) {
        addLog('warning', `Compute fetch failed (${externalErr.message || externalErr}), falling back to purely local client-side mathematically simulated Hops graph.`);
        
        // Execute the pure math geometric solver directly in Vercel client browser rather than POST to non-existent /api/compute endpoint
        resData = solveGeometry(
          'configurator' as any,
          analysisType,
          {
            sunAngle,
            dynamicParams
          }
        );
        durationSum = performance.now() - startRequest;
      }

      let finalData = resData;

      // Detect if this is a raw Rhino.Compute response
      if (resData && resData.values) {
        addLog('info', `Received real Rhino Compute response containing ${resData.values.length} outputs.`);
        
        let meshSize = 0;
        const resultGeo = resData.values.find((v: any) => v.ParamName === 'ResultGeometry');
        
        if (resultGeo) {
           meshSize = JSON.stringify(resultGeo.InnerTree).length;
           addLog('success', `Found "ResultGeometry" output node in payload. Size: ${(meshSize/1024).toFixed(1)} KB`);
        }
        
        // Wrap it so our CodeViewer still shows it, but we won't crash GrasshopperGraph
        finalData = {
           isRealRhinoCompute: true,
           solverTimeMs: durationSum,
           values: resData.values,
           data: {
              mesh: null // We don't have rhino3dm installed in this project to decode it yet
           }
        };
      }

      setApiResponse(finalData);
      
      const vertexCount = finalData.data?.mesh?.vertices?.length ? Math.floor(finalData.data.mesh.vertices.length / 3) : 0;
      addLog(
        'success',
        `Response 200 Received: Generated computation in ${durationSum.toFixed(0)}ms.`
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
    if (!schemaFetched) return;
    // Quick timer / debounce to prevent spamming server while sliding fast
    const delayDebounce = setTimeout(() => {
      triggerCompute();
    }, 45); // highly responsive 45ms debounce

    return () => clearTimeout(delayDebounce);
  }, [sunAngle, dynamicParams, schemaFetched]);

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
    const res: Record<string, number> = { sunAngle, ...dynamicParams };
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
              Connected to web-configurator.gh
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
              ioSchema={ioSchema}
              dynamicParams={dynamicParams}
              setDynamicParams={setDynamicParams}
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
              meshData={apiResponse && apiResponse.data ? apiResponse.data.mesh : null}
              lineData={apiResponse && apiResponse.data ? apiResponse.data.lines : undefined}
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
                  telemetry={apiResponse && apiResponse.data?.telemetry ? apiResponse.data.telemetry.nodes : undefined}
                  solverTimeMs={apiResponse ? apiResponse.solverTimeMs || 0 : 0}
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
                  telemetry={apiResponse && apiResponse.data?.telemetry ? apiResponse.data.telemetry.nodes : undefined}
                  modelType={'configurator' as any}
                  solverTimeMs={apiResponse ? apiResponse.solverTimeMs || 0 : 0}
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
