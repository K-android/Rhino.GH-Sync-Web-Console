/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModelType, AnalysisType, FacadeParams, CanopyParams, BridgeParams } from '../types';
import { Layers, HelpCircle, Sun, Sliders, Activity, Info } from 'lucide-react';

interface ParamsSidebarProps {
  modelType: ModelType;
  setModelType: (type: ModelType) => void;
  analysisType: AnalysisType;
  setAnalysisType: (type: AnalysisType) => void;
  facadeParams: FacadeParams;
  setFacadeParams: (params: FacadeParams) => void;
  canopyParams: CanopyParams;
  setCanopyParams: (params: CanopyParams) => void;
  bridgeParams: BridgeParams;
  setBridgeParams: (params: BridgeParams) => void;
  sunAngle: number;
  setSunAngle: (angle: number) => void;
}

export default function ParamsSidebar({
  modelType,
  setModelType,
  analysisType,
  setAnalysisType,
  facadeParams,
  setFacadeParams,
  canopyParams,
  setCanopyParams,
  bridgeParams,
  setBridgeParams,
  sunAngle,
  setSunAngle
}: ParamsSidebarProps) {

  // Simple handler to merge specific sliders updates
  const handleFacadeChange = (key: keyof FacadeParams, val: number) => {
    setFacadeParams({ ...facadeParams, [key]: val });
  };

  const handleCanopyChange = (key: keyof CanopyParams, val: number) => {
    setCanopyParams({ ...canopyParams, [key]: val });
  };

  const handleBridgeChange = (key: keyof BridgeParams, val: number) => {
    setBridgeParams({ ...bridgeParams, [key]: val });
  };

  return (
    <div className="w-full flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl p-5 overflow-auto custom-scrollbar h-full gap-5 select-none" id="params_sidebar_controls">
      {/* 1. MODEL SELECTION */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold flex items-center gap-1.5 border-b border-zinc-805 pb-1.5 mb-1.5">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          Parametric Script Template (.gh)
        </label>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => setModelType('facade')}
            className={`flex flex-col items-start text-left p-3 rounded-xl border text-sm transition font-mono ${
              modelType === 'facade'
                ? 'bg-sky-500/10 border-sky-500 text-sky-200'
                : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
            id="btn_model_facade"
          >
            <span className="font-bold text-[12px]">Wavy Louver Facade</span>
            <span className="text-[10px] text-zinc-500 mt-0.5 font-sans leading-snug">Double-curved panel optimizer grid</span>
          </button>

          <button
            onClick={() => setModelType('canopy')}
            className={`flex flex-col items-start text-left p-3 rounded-xl border text-sm transition font-mono ${
              modelType === 'canopy'
                ? 'bg-sky-500/10 border-sky-500 text-sky-200'
                : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
            id="btn_model_canopy"
          >
            <span className="font-bold text-[12px]">Hex Space Canopy</span>
            <span className="text-[10px] text-zinc-500 mt-0.5 font-sans leading-snug">Braced vault dome with variable apertures</span>
          </button>

          <button
            onClick={() => setModelType('bridge')}
            className={`flex flex-col items-start text-left p-3 rounded-xl border text-sm transition font-mono ${
              modelType === 'bridge'
                ? 'bg-sky-500/10 border-sky-500 text-sky-200'
                : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
            id="btn_model_bridge"
          >
            <span className="font-bold text-[12px]">Suspended Arch Bridge</span>
            <span className="text-[10px] text-zinc-500 mt-0.5 font-sans leading-snug">Continuous parabolas & cable tension grid</span>
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC GRASSHOPPER SLIDERS */}
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold flex items-center gap-1.5 border-b border-zinc-800 pb-1.5 mb-1.5">
          <Sliders className="w-3.5 h-3.5 text-sky-400" />
          Grasshopper Parameter Sliders
        </label>

        {/* FACADE SLIDERS */}
        {modelType === 'facade' && (
          <div className="space-y-4 font-mono text-xs">
            {/* Width */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="font-medium text-zinc-200">Facade Width</span>
                <span className="text-sky-400 font-bold">{facadeParams.width}m</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                step="5"
                value={facadeParams.width}
                onChange={(e) => handleFacadeChange('width', Number(e.target.value))}
                className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
                id="slider_facade_width"
              />
            </div>

            {/* Height */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="font-medium text-zinc-200">Facade Height</span>
                <span className="text-sky-400 font-bold">{facadeParams.height}m</span>
              </div>
              <input
                type="range"
                min="6"
                max="40"
                step="2"
                value={facadeParams.height}
                onChange={(e) => handleFacadeChange('height', Number(e.target.value))}
                className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
                id="slider_facade_height"
              />
            </div>

            {/* panelWidth */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="font-medium text-zinc-200">Panel Segment Width</span>
                <span className="text-sky-400 font-bold">{facadeParams.panelWidth}m</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="0.2"
                value={facadeParams.panelWidth}
                onChange={(e) => handleFacadeChange('panelWidth', Number(e.target.value))}
                className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
                id="slider_facade_panelWidth"
              />
            </div>

            {/* panelHeight */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="font-medium text-zinc-200">Panel Segment Height</span>
                <span className="text-sky-400 font-bold">{facadeParams.panelHeight}m</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="5"
                step="0.5"
                value={facadeParams.panelHeight}
                onChange={(e) => handleFacadeChange('panelHeight', Number(e.target.value))}
                className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
                id="slider_facade_panelHeight"
              />
            </div>

            {/* waveAmplitude */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="font-medium text-zinc-200">Depth Wave Amplitude</span>
                <span className="text-sky-400 font-bold">{facadeParams.waveAmplitude}m</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="0.5"
                value={facadeParams.waveAmplitude}
                onChange={(e) => handleFacadeChange('waveAmplitude', Number(e.target.value))}
                className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
                id="slider_facade_waveAmplitude"
              />
            </div>

            {/* waveFrequency */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="font-medium text-zinc-200">Wave Density (Freq)</span>
                <span className="text-sky-400 font-bold">{facadeParams.waveFrequency.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.2"
                step="0.05"
                value={facadeParams.waveFrequency}
                onChange={(e) => handleFacadeChange('waveFrequency', Number(e.target.value))}
                className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
                id="slider_facade_waveFrequency"
              />
            </div>

            {/* Twist */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="font-medium text-zinc-200">Individual Louver Twist</span>
                <span className="text-sky-400 font-bold">{facadeParams.twist}°</span>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                step="5"
                value={facadeParams.twist}
                onChange={(e) => handleFacadeChange('twist', Number(e.target.value))}
                className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
                id="slider_facade_twist"
              />
            </div>
          </div>
        )}

        {/* CANOPY SLIDERS */}
        {modelType === 'canopy' && (
          <div className="space-y-4 font-mono text-xs">
            {/* Span */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="font-medium text-zinc-200">Canopy Span</span>
                <span className="text-sky-400 font-bold">{canopyParams.span}m</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={canopyParams.span}
                onChange={(e) => handleCanopyChange('span', Number(e.target.value))}
                className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
                id="slider_canopy_span"
              />
            </div>

            {/* Segments (rings density) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="font-medium text-zinc-200">Hex Subdivision Rings</span>
                <span className="text-sky-400 font-bold">{canopyParams.segments} rings</span>
              </div>
              <input
                type="range"
                min="3"
                max="10"
                step="1"
                value={canopyParams.segments}
                onChange={(e) => handleCanopyChange('segments', Number(e.target.value))}
                className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
                id="slider_canopy_segments"
              />
            </div>

            {/* Dome Sag */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="font-medium text-zinc-200">Vault Bulge (Sag/Height)</span>
                <span className="text-sky-400 font-bold">{canopyParams.sag}m</span>
              </div>
              <input
                type="range"
                min="-2"
                max="12"
                step="1"
                value={canopyParams.sag}
                onChange={(e) => handleCanopyChange('sag', Number(e.target.value))}
                className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
                id="slider_canopy_sag"
              />
            </div>

            {/* Aperture */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="font-medium text-zinc-200">Hex Glass Aperture Ratio</span>
                <span className="text-sky-400 font-bold">{(canopyParams.aperture * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={canopyParams.aperture}
                onChange={(e) => handleCanopyChange('aperture', Number(e.target.value))}
                className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
                id="slider_canopy_aperture"
              />
            </div>

            {/* Truss depth */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="font-medium text-zinc-200">Space-Frame Truss Depth</span>
                <span className="text-sky-400 font-bold">{canopyParams.depth}m</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.25"
                value={canopyParams.depth}
                onChange={(e) => handleCanopyChange('depth', Number(e.target.value))}
                className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
                id="slider_canopy_depth"
              />
            </div>
          </div>
        )}

        {/* BRIDGE SLIDERS */}
        {modelType === 'bridge' && (
          <div className="space-y-4 font-mono text-xs">
            {/* Bridge Span */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="font-medium text-zinc-200">Bridge Span</span>
                <span className="text-sky-400 font-bold">{bridgeParams.bridgeSpan}m</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={bridgeParams.bridgeSpan}
                onChange={(e) => handleBridgeChange('bridgeSpan', Number(e.target.value))}
                className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
                id="slider_bridge_span"
              />
            </div>

            {/* Arch Height */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="font-medium text-zinc-200">Dual Arch Height</span>
                <span className="text-sky-400 font-bold">{bridgeParams.archHeight}m</span>
              </div>
              <input
                type="range"
                min="4"
                max="30"
                step="2"
                value={bridgeParams.archHeight}
                onChange={(e) => handleBridgeChange('archHeight', Number(e.target.value))}
                className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
                id="slider_bridge_archHeight"
              />
            </div>

            {/* Deck Width */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="font-medium text-zinc-200">Bridge Deck Width</span>
                <span className="text-sky-400 font-bold">{bridgeParams.deckWidth}m</span>
              </div>
              <input
                type="range"
                min="4"
                max="12"
                step="1"
                value={bridgeParams.deckWidth}
                onChange={(e) => handleBridgeChange('deckWidth', Number(e.target.value))}
                className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
                id="slider_bridge_deckWidth"
              />
            </div>

            {/* Cable Count */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="font-medium text-zinc-200">Hanger Cable Density</span>
                <span className="text-sky-400 font-bold">{bridgeParams.cableCount} lines</span>
              </div>
              <input
                type="range"
                min="4"
                max="30"
                step="2"
                value={bridgeParams.cableCount}
                onChange={(e) => handleBridgeChange('cableCount', Number(e.target.value))}
                className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
                id="slider_bridge_cableCount"
              />
            </div>

            {/* Arch Twist Out lean */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="font-medium text-zinc-200">Arches Outward Lean</span>
                <span className="text-sky-400 font-bold">{bridgeParams.archTwist}°</span>
              </div>
              <input
                type="range"
                min="-15"
                max="30"
                step="3"
                value={bridgeParams.archTwist}
                onChange={(e) => handleBridgeChange('archTwist', Number(e.target.value))}
                className="w-full accent-sky-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
                id="slider_bridge_archTwist"
              />
            </div>
          </div>
        )}
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
