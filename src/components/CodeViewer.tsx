/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ComputeResponse } from '../types';
import { Copy, Check, Terminal, Globe, Send, RefreshCw } from 'lucide-react';

interface CodeViewerProps {
  apiResponse: ComputeResponse | null;
  loading: boolean;
}

export default function CodeViewer({ apiResponse, loading }: CodeViewerProps) {
  const [copied, setCopied] = useState<'req' | 'res' | null>(null);

  if (!apiResponse) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 font-mono text-xs">
        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        Awaiting initial packet solution...
      </div>
    );
  }

  // Format request nicely
  const requestPayloadFormatted = JSON.stringify(
    {
      url: apiResponse.request?.endpoint || '/grasshopper',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer rhino-compute-session-jwt'
      },
      body: apiResponse.request?.params || {}
    },
    null,
    2
  );

  // Format response, truncating very long vertex/index lists to keep client rendering instant and beautiful
  const truncatedResponse = {
    grasshopperGraph: apiResponse.grasshopperGraph,
    solverTimeMs: apiResponse.solverTimeMs,
    data: apiResponse.data ? {
      mesh: apiResponse.data.mesh ? {
        vertices: truncateArray(apiResponse.data.mesh.vertices || [], 12),
        indices: truncateArray(apiResponse.data.mesh.indices || [], 15),
        colors: truncateArray(apiResponse.data.mesh.colors || [], 12),
        vertexCount: (apiResponse.data.mesh.vertices?.length || 0) / 3,
        faceCount: (apiResponse.data.mesh.indices?.length || 0) / 3
      } : undefined,
      lines: apiResponse.data.lines 
        ? `${apiResponse.data.lines.length} structural cables/chords mapped`
        : undefined,
      telemetry: apiResponse.data.telemetry
    } : apiResponse // Fallback to raw response if not matching our mock schema
  };

  const responsePayloadFormatted = JSON.stringify(truncatedResponse, null, 2);

  const copyToClipboard = (text: string, type: 'req' | 'res') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900 border border-zinc-805 rounded-xl p-4 overflow-hidden" id="json_payload_explorer">
      {/* Visual Metadata / Status Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <Terminal className="text-sky-400 w-4 h-4" />
          <span className="text-xs font-mono font-bold text-zinc-200">
            REST API Packet Monitor
          </span>
        </div>
        <div className="font-mono text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850">
          Size: ~{(JSON.stringify(apiResponse).length / 1024).toFixed(1)} KB
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-hidden min-h-0">
        {/* Left: Outgoing POST Request Payload */}
        <div className="flex flex-col bg-zinc-950 rounded-lg border border-zinc-800/80 overflow-hidden relative min-h-0">
          <div className="bg-zinc-900/60 p-2 flex justify-between items-center border-b border-zinc-800/60 shrink-0">
            <div className="flex items-center gap-2 text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider">
              <Send className="w-3.5 h-3.5" />
              <span>POST Request Packet</span>
            </div>
            <button
              onClick={() => copyToClipboard(requestPayloadFormatted, 'req')}
              className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded transition"
              id="copy_request_btn"
              title="Copy Request JSON"
            >
              {copied === 'req' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex-1 p-3 font-mono text-[10px] leading-relaxed text-zinc-300 overflow-auto scrollbar-thin select-all">
            <pre className="whitespace-pre-wrap">{requestPayloadFormatted}</pre>
          </div>
          <div className="p-1.5 bg-zinc-900/40 text-[9px] font-mono text-zinc-500 border-t border-zinc-800/40 shrink-0">
            Endpoint: ngrok /grasshopper • Target: web-configurator.gh
          </div>
        </div>

        {/* Right: Incoming JSON Response Payload */}
        <div className="flex flex-col bg-zinc-950 rounded-lg border border-zinc-800/80 overflow-hidden relative min-h-0">
          <div className="bg-zinc-900/60 p-2 flex justify-between items-center border-b border-zinc-800/60 shrink-0">
            <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 animate-pulse" />
              <span>Response Mesh Payload</span>
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(apiResponse, null, 2), 'res')}
              className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded transition"
              id="copy_response_btn"
              title="Copy Response JSON"
            >
              {copied === 'res' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex-1 p-3 font-mono text-[10px] leading-relaxed text-zinc-300 overflow-auto scrollbar-thin select-all">
            <pre className="whitespace-pre-wrap">{responsePayloadFormatted}</pre>
          </div>
          <div className="p-1.5 bg-zinc-900/40 text-[9px] font-mono text-zinc-500 border-t border-zinc-800/40 flex justify-between shrink-0">
            <span>Vertices parse to BufferAttributes</span>
            <span className="text-emerald-400 font-bold">Headers: 200 OK</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to truncate long mesh arrays for human review without burning DOM node performance
function truncateArray(arr: number[], count: number): any {
  if (arr.length <= count) return arr;
  const sliced = arr.slice(0, count).map(v => Number(v.toFixed(3)));
  return [...sliced, `... and ${arr.length - count} more floating point numbers` as any];
}
