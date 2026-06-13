import React from 'react';
import { X, ExternalLink, Server, UploadCloud, Link as LinkIcon, Settings, Play } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuideModal({ isOpen, onClose }: GuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-sky-400" />
              Grasshopper Integration Guide
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              How to connect this web application to your Rhino.Compute server via Vercel.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-sm text-zinc-300">
            
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full border border-sky-500/30 bg-sky-500/10 flex items-center justify-center text-sky-400 font-bold font-mono">
              1
            </div>
            <div className="space-y-2 pt-1.5">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Server className="w-4 h-4 text-zinc-400" />
                Setup Rhino Compute
              </h3>
              <p>
                Install Rhino 7/8 on a Windows machine or VM. Install the <strong>Rhino.Compute</strong> plugin and run the local compute server (usually listening on port 8081). Note your compute server URL, which needs to be accessible over the public internet (you can use ngrok for local testing).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full border border-sky-500/30 bg-sky-500/10 flex items-center justify-center text-sky-400 font-bold font-mono">
              2
            </div>
            <div className="space-y-2 pt-1.5">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-zinc-400" />
                Deploy to Vercel
              </h3>
              <p>
                Push this web application's code to a GitHub repository, then import it into <strong>Vercel</strong> to deploy it live. Once deployed, note down your production Vercel URL (e.g., <code className="text-sky-300 bg-sky-950/30 px-1 py-0.5 rounded">https://your-app.vercel.app</code>).
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full border border-sky-500/30 bg-sky-500/10 flex items-center justify-center text-sky-400 font-bold font-mono">
              3
            </div>
            <div className="space-y-2 pt-1.5">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Settings className="w-4 h-4 text-zinc-400" />
                Configure CORS & Endpoints
              </h3>
              <p>
                In your Rhino.Compute server configuration, assure CORS is enabled to explicitly allow requests from your Vercel URL. Then, in your Vercel Project Settings, add an environment variable pointing to your ngrok or compute server URL. It must be named exactly <code>VITE_RHINO_COMPUTE_URL</code> (the <code>VITE_</code> prefix is required for the browser to read it).
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full border border-sky-500/30 bg-sky-500/10 flex items-center justify-center text-sky-400 font-bold font-mono">
              4
            </div>
            <div className="space-y-2 pt-1.5">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Settings className="w-4 h-4 text-zinc-400" />
                Prepare Grasshopper Script (.gh)
              </h3>
              <p>
                In your <code>.gh</code> script, use <strong>Get Components</strong> to define input parameters. These names MUST exactly match the parameters sent by the web app (e.g., <code>width</code>, <code>height</code>, <code>twist</code>). Use the <strong>Context Bake</strong> component to output the resulting meshes/lines.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold font-mono">
              5
            </div>
            <div className="space-y-2 pt-1.5">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Play className="w-4 h-4 text-zinc-400" />
                Test the Integration
              </h3>
              <p>
                Open your deployed Vercel application via the public URL. Adjust the sliders in the web interface to dispatch POST requests to your Rhino server. You should now see the 3D meshes update in real-time in the viewer!
              </p>
            </div>
          </div>

        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Got it, close
          </button>
        </div>

      </div>
    </div>
  );
}
