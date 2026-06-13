/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnalysisType } from '../types';
import { HelpCircle, Sun, Sliders, Activity, Info } from 'lucide-react';

interface ParamsSidebarProps {
  analysisType: AnalysisType;
  setAnalysisType: (type: AnalysisType) => void;
  ioSchema: any[];
  dynamicParams: Record<string, number>;
  setDynamicParams: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  sunAngle: number;
  setSunAngle: (angle: number) => void;
}

export default function ParamsSidebar({
  analysisType,
  setAnalysisType,
  ioSchema,
  dynamicParams,
  setDynamicParams,
  sunAngle,
  setSunAngle
}: ParamsSidebarProps) {

  const handleParamChange = (key: string, val: number) => {
    setDynamicParams(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="w-full flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl p-5 overflow-auto custom-scrollbar h-full gap-5 select-none" id="params_sidebar_controls">
      {/* 2. DYNAMIC GRASSHOPPER SLIDERS */}
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold flex items-center gap-1.5 border-b border-zinc-800 pb-1.5 mb-1.5">
          <Sliders className="w-3.5 h-3.5 text-sky-400" />
          Web Configurator Sliders
        </label>

        <div className="space-y-4 font-mono text-xs">
          {ioSchema.length === 0 && (
             <div className="text-zinc-500 text-center py-4 bg-zinc-950/50 rounded flex flex-col items-center gap-2">
               <span className="w-4 h-4 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin"></span>
               Fetching IO schema from Grasshopper definition...
             </div>
          )}
          {ioSchema.map((inputEl, idx) => {
            const val = dynamicParams[inputEl.Name] ?? (inputEl.Default || 0);
            return (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-zinc-300">
                  <span className="font-medium text-zinc-200" title={inputEl.Description}>{inputEl.Nickname || inputEl.Name}</span>
                  <span className="text-sky-400 font-bold">{Number(val).toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={inputEl.Minimum !== undefined ? inputEl.Minimum : 0}
                  max={inputEl.Maximum !== undefined ? inputEl.Maximum : 100}
                  step={0.1}
                  value={val}
                  onChange={(e) => handleParamChange(inputEl.Name, Number(e.target.value))}
                  className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SIMULATED SUN ORIENTATION */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold flex items-center gap-1.5 border-b border-zinc-800 pb-1.5 mb-1.5">
          <Sun className="w-3.5 h-3.5 text-sky-400" />
          Heliodon Sun Orientation
        </label>
        <div className="flex flex-col gap-1.5 font-mono text-xs">
          <div className="flex justify-between text-zinc-300">
            <span>Sun Azimuth Angle</span>
            <span className="text-sky-400 font-bold">{sunAngle}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="180"
            step="5"
            value={sunAngle}
            onChange={(e) => setSunAngle(Number(e.target.value))}
            className="w-full accent-sky-500 bg-zinc-950 cursor-pointer h-1.5"
            id="slider_sun_angle"
          />
        </div>
      </div>

      {/* 4. PERFORMANCE HEATMAP ANALYSIS OVERLAYS */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold flex items-center gap-1.5 border-b border-zinc-800 pb-1.5 mb-1.5">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          Solver Analysis Mesh Overlay
        </label>
        <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80">
          <button
            onClick={() => setAnalysisType('solar')}
            className={`py-1.5 text-[10px] text-center font-mono font-bold rounded-lg transition ${
              analysisType === 'solar'
                ? 'bg-sky-500 text-black'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            id="btn_analysis_solar"
            title="Solar Radiation Heatmap"
          >
            Solar
          </button>
          <button
            onClick={() => setAnalysisType('stress')}
            className={`py-1.5 text-[10px] text-center font-mono font-bold rounded-lg transition ${
              analysisType === 'stress'
                ? 'bg-sky-500 text-black'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            id="btn_analysis_stress"
            title="Boundary stress structural heatmap (FEA)"
          >
            Stress
          </button>
          <button
            onClick={() => setAnalysisType('cost')}
            className={`py-1.5 text-[10px] text-center font-mono font-bold rounded-lg transition ${
              analysisType === 'cost'
                ? 'bg-sky-500 text-black'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            id="btn_analysis_cost"
            title="Material fabrication tooling premium cost"
          >
            Cost
          </button>
        </div>
      </div>

      {/* 5. CONCEPT EXPLAINER CORNER */}
      <div className="mt-auto p-3.5 bg-zinc-950/85 rounded-xl border border-zinc-800/60 font-sans">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-sky-400 block shrink-0 mt-0.5" />
          <div className="flex flex-col text-[11px] leading-relaxed text-zinc-400">
            <span className="font-mono font-bold text-zinc-200">How the pipeline works:</span>
            <p className="mt-1">
              Adjusting sliders triggers rapid API POST exchanges containing active nodes parameters.
              Headless <strong className="text-sky-450 text-sky-300">Rhino.Compute</strong> processes inputs via Grasshopper, returning optimized vertex index arrays directly to ThreeJS in milliseconds without desktop CAD overhead.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
