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
      const { modelType, analysisType, facadeParams, canopyParams, bridgeParams, sunAngle } = req.body;

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
