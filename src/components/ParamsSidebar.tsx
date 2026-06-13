/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnalysisType, ConfiguratorParams } from '../types';
import { Layers, HelpCircle, Sun, Sliders, Activity, Info } from 'lucide-react';

interface ParamsSidebarProps {
  analysisType: AnalysisType;
  setAnalysisType: (type: AnalysisType) => void;
  configuratorParams: ConfiguratorParams;
  setConfiguratorParams: (params: ConfiguratorParams) => void;
  sunAngle: number;
  setSunAngle: (angle: number) => void;
}

export default function ParamsSidebar({
  analysisType,
  setAnalysisType,
  configuratorParams,
  setConfiguratorParams,
  sunAngle,
  setSunAngle
}: ParamsSidebarProps) {

  const handleConfiguratorChange = (key: keyof ConfiguratorParams, val: number) => {
    setConfiguratorParams({ ...configuratorParams, [key]: val });
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
          {/* Rotation Angle */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-zinc-300">
              <span className="font-medium text-zinc-200">Rotation Angle</span>
              <span className="text-sky-400 font-bold">{configuratorParams.rotationAngle}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              step="5"
              value={configuratorParams.rotationAngle}
              onChange={(e) => handleConfiguratorChange('rotationAngle', Number(e.target.value))}
              className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          {/* Offset Distance */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-zinc-300">
              <span className="font-medium text-zinc-200">Offset Distance</span>
              <span className="text-sky-400 font-bold">{configuratorParams.offsetDistance.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="-10"
              max="10"
              step="0.1"
              value={configuratorParams.offsetDistance}
              onChange={(e) => handleConfiguratorChange('offsetDistance', Number(e.target.value))}
              className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          {/* Population Count */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-zinc-300">
              <span className="font-medium text-zinc-200">Population Count</span>
              <span className="text-sky-400 font-bold">{configuratorParams.populationCount}</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={configuratorParams.populationCount}
              onChange={(e) => handleConfiguratorChange('populationCount', Number(e.target.value))}
              className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          {/* Max Extrude Z */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-zinc-300">
              <span className="font-medium text-zinc-200">Max Extrude Z</span>
              <span className="text-sky-400 font-bold">{configuratorParams.maxExtrudeZ.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="0.5"
              value={configuratorParams.maxExtrudeZ}
              onChange={(e) => handleConfiguratorChange('maxExtrudeZ', Number(e.target.value))}
              className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          {/* Min Extrude Z */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-zinc-300">
              <span className="font-medium text-zinc-200">Min Extrude Z</span>
              <span className="text-sky-400 font-bold">{configuratorParams.minExtrudeZ.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="0.5"
              value={configuratorParams.minExtrudeZ}
              onChange={(e) => handleConfiguratorChange('minExtrudeZ', Number(e.target.value))}
              className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          {/* Max Move Z */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-zinc-300">
              <span className="font-medium text-zinc-200">Max Move Z</span>
              <span className="text-sky-400 font-bold">{configuratorParams.maxMoveZ.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="0.5"
              value={configuratorParams.maxMoveZ}
              onChange={(e) => handleConfiguratorChange('maxMoveZ', Number(e.target.value))}
              className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          {/* Min Move Z */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-zinc-300">
              <span className="font-medium text-zinc-200">Min Move Z</span>
              <span className="text-sky-400 font-bold">{configuratorParams.minMoveZ.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="0.5"
              value={configuratorParams.minMoveZ}
              onChange={(e) => handleConfiguratorChange('minMoveZ', Number(e.target.value))}
              className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          {/* Max X Size */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-zinc-300">
              <span className="font-medium text-zinc-200">Max X Size</span>
              <span className="text-sky-400 font-bold">{configuratorParams.maxXSize.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="50"
              step="0.5"
              value={configuratorParams.maxXSize}
              onChange={(e) => handleConfiguratorChange('maxXSize', Number(e.target.value))}
              className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          {/* Max Y Size */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-zinc-300">
              <span className="font-medium text-zinc-200">Max Y Size</span>
              <span className="text-sky-400 font-bold">{configuratorParams.maxYSize.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="50"
              step="0.5"
              value={configuratorParams.maxYSize}
              onChange={(e) => handleConfiguratorChange('maxYSize', Number(e.target.value))}
              className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
            />
          </div>
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
