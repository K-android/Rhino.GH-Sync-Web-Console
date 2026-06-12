/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NodeTiming, ModelType } from '../types';
import { Timer, Server, Cpu } from 'lucide-react';

interface TelemetryChartProps {
  telemetry: NodeTiming[] | undefined;
  modelType: ModelType;
  solverTimeMs: number;
}

export default function TelemetryChart({ telemetry, modelType, solverTimeMs }: TelemetryChartProps) {
  if (!telemetry || telemetry.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 font-mono text-xs">
        No active solver timings available...
      </div>
    );
  }

  // Find max time to scale bars nicely
  const maxTime = Math.max(...telemetry.map(t => t.timeMs), 1);
  const totalInternal = telemetry.reduce((acc, curr) => acc + curr.timeMs, 0);

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl p-4 overflow-hidden" id="solver_telemetry_board">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <Timer className="text-sky-400 w-4 h-4" />
          <span className="text-xs font-mono font-bold text-zinc-200">
            Rhino.Compute Profiler (Hops Thread)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
            <Cpu className="w-3 h-3 text-zinc-500" />
            <span>Solver Core: {totalInternal.toFixed(1)}ms</span>
          </div>
        </div>
      </div>

      {/* Profile grid bar chart - added overflow-y-auto, customized spacing */}
      <div className="flex-1 overflow-y-auto space-y-2.5 max-w-2xl mx-auto w-full p-3 bg-zinc-950 rounded-xl border border-zinc-850 scrollbar-thin">
        {telemetry.map((node) => {
          const ratio = (node.timeMs / maxTime) * 100;
          return (
            <div key={node.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-1 group border-b border-zinc-900/45 pb-1.5 last:border-b-0 last:pb-0">
              {/* Node Name */}
              <div className="w-full sm:w-40 text-[10.5px] font-mono font-medium text-zinc-300 truncate select-none group-hover:text-sky-400 transition">
                {node.name}
              </div>
              
              {/* Graphic Bar */}
              <div className="flex-1 flex items-center gap-3">
                <div className="flex-1 h-3 bg-zinc-900 rounded border border-zinc-800/80 overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded transition-all duration-500 ease-out"
                    style={{ width: `${ratio}%` }}
                  ></div>
                </div>
                {/* Micro timing */}
                <div className="w-14 text-right text-[10px] font-mono font-bold text-zinc-400 group-hover:text-zinc-200 transition">
                  {node.timeMs.toFixed(1)} ms
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer on Network Latency */}
      <div className="mt-3 p-2.5 bg-zinc-950/60 rounded-lg border border-zinc-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[10px] font-mono text-zinc-400 shrink-0">
        <div className="flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5 text-sky-400" />
          <span>Local virtual machine status: <strong className="text-emerald-400 uppercase">Idle (0.4% CPU)</strong></span>
        </div>
        <div className="flex gap-4">
          <div>
            Compute Solver: <span className="text-white font-bold">{solverTimeMs}ms</span>
          </div>
          <div>
            RTT Web Loop: <span className="text-emerald-400 font-bold">{(solverTimeMs + 12).toFixed(0)}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
