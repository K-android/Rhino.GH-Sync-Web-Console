/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NodeTiming, ModelType } from '../types';
import { Network, Database, Cpu, HardDriveDownload } from 'lucide-react';

interface GrasshopperGraphProps {
  modelType: ModelType;
  params: Record<string, number>;
  telemetry: NodeTiming[] | undefined;
  solverTimeMs: number;
}

export default function GrasshopperGraph({
  modelType,
  params,
  telemetry,
  solverTimeMs
}: GrasshopperGraphProps) {
  
  // Extract timings for specific components if available
  const getTiming = (id: string, defaultVal: number): string => {
    if (!telemetry) return `${defaultVal}ms`;
    const item = telemetry.find(n => n.id.includes(id) || id.includes(n.id));
    return item ? `${item.timeMs.toFixed(1)}ms` : `${defaultVal}ms`;
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl p-4 overflow-hidden" id="gh_graph_visualizer">
      {/* Visual Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-1 px-2 rounded-lg bg-sky-500/10 text-sky-400 font-mono text-[10px] uppercase font-bold tracking-widest border border-sky-500/20">
            Grasshopper Graph
          </div>
          <h4 className="text-xs font-mono font-medium text-zinc-200">
            web-configurator.gh
          </h4>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
          <Cpu className="w-3.5 h-3.5" />
          <span>Server solved: {solverTimeMs}ms</span>
        </div>
      </div>

      {/* Interactive Visual Canvas Container */}
      <div className="flex-1 relative overflow-auto custom-scrollbar flex items-center justify-center p-3 bg-zinc-950 rounded-xl border border-zinc-850 min-h-0 h-full">
        {/* Dynamic connection SVG lines layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '550px', minHeight: '265px' }}>
          <defs>
            <linearGradient id="wire-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="wire-active" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>

          {/* Connect Input Box to Math Engine */}
          <path d="M 160 85 C 210 85, 200 135, 250 135" stroke="url(#wire-gradient)" strokeWidth="1.5" fill="none" />
          <path d="M 160 165 C 210 165, 200 145, 250 145" stroke="url(#wire-gradient)" strokeWidth="1.5" fill="none" />
          <path d="M 160 245 C 210 245, 200 175, 250 160" stroke="url(#wire-gradient)" strokeWidth="1.5" fill="none" />

          {/* Connect Math Engine to Mesh Creator */}
          <path d="M 370 145 C 400 145, 410 165, 435 165" stroke="url(#wire-gradient)" strokeWidth="2" fill="none" />
          
          {/* Output wires to serialization */}
          <path d="M 545 175 C 570 175, 565 210, 580 210" stroke="url(#wire-active)" strokeWidth="1.8" fill="none" className="stroke-dasharray-anim" />
        </svg>

        {/* Visual node layouts grouped in standard Canvas columns */}
        <div className="flex justify-between items-stretch w-full gap-5 z-10 select-none min-w-[540px]">
          
          {/* Column 1: Active Sliders (REST inputs) */}
          <div className="flex flex-col justify-around gap-4 w-40">
            <div className="text-[10px] font-mono text-zinc-550 uppercase font-semibold text-center pb-1 border-b border-zinc-950 mb-1">
              Compute IO Schema Params
            </div>

            {/* Render dynamic inputs based on modelType */}
            {Object.entries(params).filter(([key]) => key !== 'sunAngle').slice(0, 3).map(([key, val]) => (
              <div 
                key={key} 
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 flex flex-col group hover:border-sky-500 transition-all shadow-lg"
                id={`gh_node_input_${key}`}
              >
                <div className="flex justify-between items-center text-[9px] font-mono text-sky-400 font-bold uppercase tracking-wide">
                  <span className="truncate mr-2">{formatLabel(key)}</span>
                  <span className="bg-sky-500/10 text-sky-300 px-1 rounded">{Number(val).toFixed(0)}</span>
                </div>
                <div className="w-full bg-zinc-950 rounded h-1.5 mt-1.5 overflow-hidden">
                  <div 
                    className="bg-sky-500 h-full rounded transition-all duration-300"
                    style={{ width: `${getSliderPercent(key, val)}%` }}
                  ></div>
                </div>
              </div>
            ))}

            {/* Extra context node for Sun lighting angle */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 flex flex-col hover:border-sky-500 transition-all" id="gh_node_input_sun">
              <span className="text-[9px] font-mono text-sky-400 font-bold uppercase tracking-wide">Sun orientation</span>
              <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 mt-1">
                <span>Vector3D</span>
                <span className="text-[10px] text-zinc-350 font-bold">Z: {params.sunAngle || 45}°</span>
              </div>
            </div>
          </div>

          {/* Column 2: Mathematical Engine / Grasshopper Solver Components */}
          <div className="flex flex-col justify-center items-center gap-6 w-44">
            <div className="text-[10px] font-mono text-zinc-550 uppercase font-semibold text-center pb-1 border-b border-zinc-950 mb-1 w-full">
              Geometric Engines
            </div>

            {/* Solver Block */}
            <div 
              className="bg-zinc-900 border-2 border-emerald-500 rounded-xl overflow-hidden w-full shadow-xl"
              id="gh_node_solver"
            >
              {/* Node Header */}
              <div className="bg-emerald-950/80 border-b border-zinc-850 p-2 flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Cpu className="text-emerald-400 w-3 h-3" />
                  <span className="text-[10px] font-mono font-bold text-zinc-200 uppercase tracking-tight">
                    Custom Configurator Engine
                  </span>
                </div>
                <span className="text-[8px] font-mono bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded">
                  {getTiming('web_configurator', 3)}
                </span>
              </div>
              
              {/* Ports */}
              <div className="p-2.5 text-[9px] font-mono text-zinc-400 flex justify-between items-stretch">
                {/* Inputs */}
                <div className="flex flex-col gap-1 text-left">
                  <div>• u: Domain</div>
                  <div>• v: Steps</div>
                  <div>• a: Factor</div>
                </div>
                {/* Outputs */}
                <div className="flex flex-col gap-1 text-right text-emerald-400 font-medium">
                  <div>Pts •</div>
                  <div>Vec •</div>
                </div>
              </div>
            </div>

            {/* Structural analysis calculator */}
            <div 
              className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden w-full shadow-lg"
              id="gh_node_analysis"
            >
              <div className="bg-zinc-950 border-b border-zinc-850 p-1.5 flex justify-between items-center">
                <span className="text-[9px] font-mono font-bold text-zinc-300 uppercase">Analysis Mapper</span>
                <span className="text-[8px] font-mono text-zinc-400 font-medium">
                  {getTiming('solar_radiation', 2)}
                </span>
              </div>
              <div className="p-1.5 text-[9px] font-mono text-zinc-500 flex justify-between">
                <span>• MeshGeometry</span>
                <span className="text-sky-400 font-bold">• Colors</span>
              </div>
            </div>
          </div>

          {/* Column 3: Serialization outputs */}
          <div className="flex flex-col justify-center gap-6 w-40">
            <div className="text-[10px] font-mono text-zinc-550 uppercase font-semibold text-center pb-1 border-b border-zinc-950 mb-1">
              Serialization Ports
            </div>

            {/* Mesh Maker */}
            <div 
              className="bg-zinc-900 border border-sky-500/50 rounded-xl overflow-hidden w-full shadow-xl"
              id="gh_node_mesher"
            >
              <div className="bg-sky-950/40 border-b border-zinc-850 p-1.5 flex justify-between items-center">
                <span className="text-[9px] font-mono font-bold text-sky-400 uppercase">Mesh Loft / Cap</span>
                <span className="text-[8px] font-mono bg-sky-500/10 text-sky-300 px-1 rounded">
                  {getTiming('mesh_output', 4)}
                </span>
              </div>
              <div className="p-2 text-[9px] font-mono text-zinc-500 flex justify-between">
                <div>
                  <div>• Vertices</div>
                  <div>• Normals</div>
                </div>
                <div className="text-sky-400 font-bold flex items-end">Mesh •</div>
              </div>
            </div>

            {/* Web Serializer Final Node */}
            <div 
              className="bg-zinc-900 border border-sky-500/40 rounded-xl overflow-hidden w-full shadow-xl"
              id="gh_node_output"
            >
              <div className="bg-sky-950/20 p-2 flex justify-between items-center border-b border-zinc-855">
                <span className="text-[9px] font-mono font-bold text-sky-300 uppercase">Compute Output JSON</span>
                <span className="text-[8px] font-mono text-zinc-400">{getTiming('json_serialize', 0.9)}</span>
              </div>
              <div className="p-2.5 flex items-center justify-between text-[9px] font-mono text-zinc-400">
                <div className="flex items-center gap-1 text-zinc-300">
                  <Database className="w-3 h-3 text-sky-400" />
                  <span>3DMeshChunk</span>
                </div>
                <span className="text-sky-400 font-bold">•</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Visual wire flow legend */}
      <div className="mt-3 flex items-center gap-4 text-[10px] font-mono text-zinc-550 bg-zinc-950/50 p-2 rounded-xl border border-zinc-850">
        <span className="text-sky-400 font-bold">▲ Wire lines representing floating point REST packets.</span>
        <span className="text-sky-400 font-bold">■ Mesh array buffers serialization.</span>
      </div>
    </div>
  );
}

function formatLabel(key: string): string {
  // If no explicit case, split camelCase
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim();
}

// Convert Slider value to simple percentages for visualization
function getSliderPercent(key: string, val: number): number {
  // Simple deterministic hash based on string length and val to show dynamic bars
  return Math.abs(Math.sin((key.length * val) || 1) * 100) || 50;
}
