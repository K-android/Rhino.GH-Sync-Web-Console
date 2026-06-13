/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { solveGeometry } from './server/solver';
import { ModelType, AnalysisType } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON parsing for POST data packets
  app.use(express.json());

  // 1. The Core Parametric Hops Endpoint / Rhino.Compute Proxy
  // Handles POST and GET requests representing the Grasshopper slider mapping exchange
  app.post('/api/compute', (req, res) => {
    try {
      const { modelType, analysisType, facadeParams, canopyParams, bridgeParams, sunAngle, pointer, values } = req.body;

      if (pointer && values) {
         // Fake integration response format if they hit local server instead of ngrok
         return res.json({
           solverTimeMs: 12,
           data: {
             mesh: { vertices: [0,0,0, 10,0,0, 5,10,0], indices: [0,1,2], colors: [0.5,0.5,0.5] },
             telemetry: { nodes: [] }
           }
         });
      }

      if (!modelType) {
        return res.status(400).json({ error: 'Missing parameter: modelType' });
      }

      // Solve geometry mathematically relative to chosen inputs
      const solution = solveGeometry(
        modelType as ModelType,
        (analysisType || 'solar') as AnalysisType,
        {
          facade: facadeParams,
          canopy: canopyParams,
          bridge: bridgeParams,
          sunAngle: sunAngle ? Number(sunAngle) : undefined,
        }
      );

      return res.json(solution);
    } catch (err: any) {
      console.error('Rhino.Compute Proxy Error:', err);
      return res.status(500).json({
        error: 'Grasshopper Server Compute Failed',
        details: err?.message || err,
      });
    }
  });

  app.post('/api/io', async (req, res) => {
    try {
      const { externalUrl, pointer } = req.body;
      if (externalUrl && externalUrl.startsWith('http')) {
        let targetUrl = externalUrl.replace(/\/$/, '');
        if (!targetUrl.endsWith('/io')) {
          targetUrl = targetUrl.replace('/grasshopper', '') + '/io';
        }
        const resp = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
          body: JSON.stringify({ pointer })
        });
        if (resp.ok) {
          const data = await resp.json();
          return res.json(data);
        }
        console.log('Remote IO fetch failed:', resp.status, 'falling back...');
      }
    } catch (err) {
      console.log('Remote IO fetch unavailable, falling back to local simulation schema.');
    }
    
    // Fallback to fake data
    return res.json({
      Description: "Web Configurator Grasshopper Script",
      Inputs: [
        { Name: "RotationAngle", Default: 45, Minimum: -180, Maximum: 180 },
        { Name: "OffsetDistance", Default: 2.0, Minimum: -10, Maximum: 10 },
        { Name: "PopulationCount", Default: 10, Minimum: 1, Maximum: 100 },
        { Name: "MaxExtrudeZ", Default: 10.0, Minimum: 0.1, Maximum: 50 },
        { Name: "MinExtrudeZ", Default: 2.0, Minimum: 0.1, Maximum: 50 },
        { Name: "MaxMoveZ", Default: 5.0, Minimum: -20, Maximum: 20 },
        { Name: "MinMoveZ", Default: 0.0, Minimum: -20, Maximum: 20 },
        { Name: "MaxXSize", Default: 10.0, Minimum: 0.1, Maximum: 50 },
        { Name: "MaxYSize", Default: 10.0, Minimum: 0.1, Maximum: 50 }
      ],
      Outputs: [ { Name: "Preview" } ]
    });
  });

  // Supporting GET query strings as well for easy debugging (e.g. testing endpoint)
  app.get('/api/compute', (req, res) => {
    try {
      const modelType = (req.query.modelType as ModelType) || 'facade';
      const analysisType = (req.query.analysisType as AnalysisType) || 'solar';
      
      const solution = solveGeometry(modelType, analysisType, {
        sunAngle: req.query.sunAngle ? Number(req.query.sunAngle) : undefined,
      });
      return res.json(solution);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 2. Vite Middleware Setup for seamless SPA serving in both development & production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Rhino.Compute Proxy Console Hub running at http://localhost:${PORT}]`);
  });
}

startServer();
