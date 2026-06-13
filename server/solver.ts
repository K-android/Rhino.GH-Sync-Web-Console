/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ComputeResponse,
  ModelType,
  AnalysisType,
  FacadeParams,
  CanopyParams,
  BridgeParams,
  NodeTiming
} from '../src/types';

// Helper: Normalize 3D vector
function normalize(v: [number, number, number]): [number, number, number] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len === 0) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

// Helper: Dot product of two vectors
function dot(v1: [number, number, number], v2: [number, number, number]): number {
  return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
}

// Color interpolator for heatmaps (cool blue -> green -> yellow -> red)
function getColorForValue(val: number): [number, number, number] {
  const v = Math.max(0, Math.min(1, val));
  if (v < 0.33) {
    // Blue to Green-Blue
    const t = v / 0.33;
    return [0.1 + t * 0.1, 0.3 + t * 0.5, 0.9 - t * 0.5];
  } else if (v < 0.66) {
    // Green-Blue to Orange-Yellow
    const t = (v - 0.33) / 0.33;
    return [0.2 + t * 0.7, 0.8 + t * 0.1, 0.4 - t * 0.3];
  } else {
    // Yellow to Red
    const t = (v - 0.66) / 0.34;
    return [0.9 + t * 0.1, 0.9 - t * 0.7, 0.1 - t * 0.1];
  }
}

export function solveGeometry(
  modelType: string,
  analysisType: AnalysisType,
  params: {
    facade?: FacadeParams;
    canopy?: CanopyParams;
    bridge?: BridgeParams;
    sunAngle?: number;
    dynamicParams?: Record<string, number>;
  }
): ComputeResponse {
  const start = Date.now();
  const timings: NodeTiming[] = [];
  const warnings: string[] = [];

  const sunAngle = params.sunAngle ?? 45;
  const sunRad = (sunAngle * Math.PI) / 180;
  // Position of sun vector in layout: angled from side, downward vector
  const sunDir = normalize([Math.cos(sunRad), 1.0, Math.sin(sunRad)]);

  // Flat containers for mesh vertices, indices, and colors
  const vertices: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];
  const normalsList: number[] = [];
  const lines: { start: [number, number, number]; end: [number, number, number]; color?: string }[] = [];

  let graphName = 'parametric_model_solver.gh';

  if (modelType === 'facade') {
    graphName = 'double_curved_facade_panelizer.gh';
    const tStart = Date.now();
    
    const p = params.facade ?? {
      width: 40,
      height: 24,
      panelWidth: 2,
      panelHeight: 3,
      waveAmplitude: 2.0,
      waveFrequency: 0.25,
      twist: 15
    };

    timings.push({ id: 'hops_inputs', name: 'Rhino Hops Input Bindings', timeMs: 0.8 });

    // Step 2: Mesh Grid division & division domain calculations
    const cols = Math.max(2, Math.min(60, Math.ceil(p.width / p.panelWidth)));
    const rows = Math.max(2, Math.min(40, Math.ceil(p.height / p.panelHeight)));
    timings.push({ id: 'grid_division', name: 'Domain Subdivision Grid', timeMs: 1.2 });

    const stepX = p.width / cols;
    const stepY = p.height / rows;
    const twistRad = (p.twist * Math.PI) / 180;

    let vIdx = 0;

    // Outer calculations: Generating parametric panels
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const xPivot = c * stepX - p.width / 2 + stepX / 2;
        const yPivot = r * stepY - p.height / 2 + stepY / 2;

        // Wave depth calculation (evaluated coordinate)
        const zPivot = Math.sin(c * p.waveFrequency + r * 0.15) * p.waveAmplitude;

        // Create Panel local panel coordinate offsets
        const wHalf = stepX * 0.44; // slight joint gap
        const hHalf = stepY * 0.44;

        // Vertices with Twist around dynamic Y axis
        // Point local space -> 3D space rotation around vertical Y: xRot = x*cos(twist), zRot = x*sin(twist)
        // Back and front double-thickness face offsets (giving it volumetric presence)
        const thick = 0.08;

        const localVerts: [number, number, number][] = [];
        // Local quad points relative to pivot: (TL, TR, BR, BL) on front and back
        const signs = [
          [-1, 1],  // Top-Left
          [1, 1],   // Top-Right
          [1, -1],  // Bottom-Right
          [-1, -1]  // Bottom-Left
        ];

        // 8 points for a extruded box representing a facade panel: front (0,1,2,3) then back (4,5,6,7)
        for (const tType of [thick / 2, -thick / 2]) {
          for (const [sx, sy] of signs) {
            const lx = sx * wHalf;
            const ly = sy * hHalf;
            
            // Twist rotation around vertical Y-axis
            const rx = lx * Math.cos(twistRad) - tType * Math.sin(twistRad);
            const rz = lx * Math.sin(twistRad) + tType * Math.cos(twistRad);

            localVerts.push([
              xPivot + rx,
              yPivot + ly,
              zPivot + rz
            ]);
          }
        }

        // Push Vertices
        localVerts.forEach(v => vertices.push(...v));

        // Let's analyze metrics to determine color
        // Front panel Normal vector rotated
        const panelNormal = normalize([Math.sin(twistRad), 0, Math.cos(twistRad)]);
        
        let colorFactor = 0.5;
        if (analysisType === 'solar') {
          // Dot product with Sun Ray direction
          const solarExp = Math.max(0, dot(panelNormal, sunDir));
          // Apply altitude scalar
          const heightRatio = r / rows;
          colorFactor = solarExp * 0.7 + heightRatio * 0.3;
        } else if (analysisType === 'stress') {
          // Deflection strain calculation: middle panels twist much further, edges have constraints
          const midX = cols / 2;
          const midY = rows / 2;
          const distToCenter = Math.sqrt((c - midX) ** 2 + (r - midY) ** 2) / Math.sqrt(midX ** 2 + midY ** 2);
          colorFactor = Math.abs(Math.sin(distToCenter * 3.14 + (p.twist / 90))) * 0.8 + 0.1;
        } else {
          // Cost Analysis: steeper twists and double curve amplitudes require bespoke frame construction
          const twistPen = Math.abs(p.twist) / 45;
          const curvePen = Math.abs(p.waveAmplitude) / 5.0;
          colorFactor = Math.min(1.0, 0.2 + twistPen * 0.5 + curvePen * 0.3);
        }

        const [rgbR, rgbG, rgbB] = getColorForValue(colorFactor);

        // Push colors for all 8 vertices of this cell panel
        for (let j = 0; j < 8; j++) {
          colors.push(rgbR, rgbG, rgbB);
        }

        // Generate faces (12 triangles for box): front, back, and 4 sides
        // Vertices indexes: front: vIdx, vIdx+1, vIdx+2, vIdx+3. back: vIdx+4, vIdx+5, vIdx+6, vIdx+7
        const f = vIdx;
        const panelIndices = [
          // Front face (TL, TR, BR, BL)
          f, f + 1, f + 2,
          f, f + 2, f + 3,
          // Back face (TR_b, TL_b, BL_b, BR_b) and flipped to watch inwards
          f + 5, f + 4, f + 7,
          f + 5, f + 7, f + 6,
          // Top face (TL_b, TR_b, TR, TL)
          f + 4, f + 5, f + 1,
          f + 4, f + 1, f,
          // Bottom face (BL, BR, BR_b, BL_b)
          f + 3, f + 2, f + 6,
          f + 3, f + 6, f + 7,
          // Right face (TR, TR_b, BR_b, BR)
          f + 1, f + 5, f + 6,
          f + 1, f + 6, f + 2,
          // Left face (TL_b, TL, BL, BL_b)
          f + 4, f, f + 3,
          f + 4, f + 3, f + 7
        ];
        indices.push(...panelIndices);
        vIdx += 8;
      }
    }

    timings.push({ id: 'sine_waves', name: 'Sine Curve Math Evaluator', timeMs: (Date.now() - tStart) * 0.35 });
    timings.push({ id: 'panelizer', name: 'Volumetric Panelizer Mesh Extender', timeMs: (Date.now() - tStart) * 0.45 });
    timings.push({ id: 'solar_radiation', name: 'Solar Thermal Exposure Engine', timeMs: (Date.now() - tStart) * 0.2 });

  } else if (modelType === 'canopy') {
    graphName = 'braced_hex_vault_generator.gh';
    const tStart = Date.now();

    const p = params.canopy ?? {
      span: 30,
      segments: 8,
      sag: 4,
      aperture: 0.5,
      depth: 1.5
    };

    timings.push({ id: 'hops_inputs', name: 'Hops Endpoint Mapping', timeMs: 0.6 });

    // Radial hexagonal staggered grid division
    // segments corresponds to rings of hexagons
    const numRings = Math.max(2, Math.min(10, p.segments));
    const cellRadius = p.span / (numRings * 2);

    timings.push({ id: 'dome_vault', name: 'Dome Profile Vault Mapper', timeMs: 1.1 });

    let vIdx = 0;

    // Generate staggering cells around grid origin
    for (let r = 0; r <= numRings; r++) {
      // Calculate amount of hexes in this circle/ring
      const numHexes = r === 0 ? 1 : r * 6;
      for (let h = 0; h < numHexes; h++) {
        // Position of hex center
        let cx = 0;
        let cy = 0;
        
        if (r > 0) {
          const angle = (h * (2 * Math.PI)) / numHexes;
          cx = r * cellRadius * Math.sin(60 * Math.PI / 180) * Math.cos(angle);
          cy = r * cellRadius * Math.sin(60 * Math.PI / 180) * Math.sin(angle);
        }

        // Vault Elevation (parabola dome vault sag)
        const distFromCenter = Math.sqrt(cx * cx + cy * cy);
        const ratio = Math.min(1.0, distFromCenter / (p.span * 0.6));
        const cz = (1.0 - ratio * ratio) * p.sag;

        // Generates Hex vertices: outer ring of 6 points, and inner ring of 6 points
        const localVerts: [number, number, number][] = [];
        
        // Compute 6 points for outer Hexagon flat rotated
        const pAngles = [0, 60, 120, 180, 240, 300].map(deg => (deg * Math.PI) / 180);

        for (const angle of pAngles) {
          // outer point
          const ox = cx + cellRadius * 0.9 * Math.cos(angle);
          const oy = cy + cellRadius * 0.9 * Math.sin(angle);
          const od = Math.sqrt(ox * ox + oy * oy);
          const oz = (1.0 - Math.min(1.0, od / (p.span * 0.6)) ** 2) * p.sag;
          localVerts.push([ox, oy, oz]);
        }

        for (const angle of pAngles) {
          // inner point
          const ix = cx + cellRadius * 0.9 * p.aperture * Math.cos(angle);
          const iy = cy + cellRadius * 0.9 * p.aperture * Math.sin(angle);
          const id = Math.sqrt(ix * ix + iy * iy);
          const iz = (1.0 - Math.min(1.0, id / (p.span * 0.6)) ** 2) * p.sag + 0.05; // raise slightly
          localVerts.push([ix, iy, iz]);
        }

        // Push Hex Panel Vertices: 12 vertices
        localVerts.forEach(v => vertices.push(...v));

        // Heatmap calculation
        let colorFactor = 0.5;
        if (analysisType === 'stress') {
          // Column connections at the base (outermost rings) feel maximum stress
          colorFactor = Math.pow(ratio, 2.5); // center stress low, margins high loading forces
        } else if (analysisType === 'solar') {
          // Roof vectors: steeper panels has higher sun alignment
          const domeSlopeNormal = normalize([-cx / p.span, -cy / p.span, 1.0]);
          colorFactor = Math.max(0.0, dot(domeSlopeNormal, sunDir));
        } else {
          // Cost analysis: panels near edge have wider sizes or aperture factors
          colorFactor = (0.3 + (1.0 - p.aperture) * 0.6);
        }

        const [rgbR, rgbG, rgbB] = getColorForValue(colorFactor);
        for (let j = 0; j < 12; j++) {
          colors.push(rgbR, rgbG, rgbB);
        }

        // Faces: Connect 6 outer points to 6 inner points forming a ring of 6 trapezoids
        // Outer indices: 0..5, Inner indices: 6..11
        const f = vIdx;
        for (let i = 0; i < 6; i++) {
          const next = (i + 1) % 6;
          // Triangle 1: Outer(i) -> Outer(next) -> Inner(next)
          indices.push(f + i, f + next, f + 6 + next);
          // Triangle 2: Outer(i) -> Inner(next) -> Inner(i)
          indices.push(f + i, f + 6 + next, f + 6 + i);
        }

        // Add 3D structural trusses underneath (Wire Frame Truss chords)
        // Draw cables from outer hex nodes to a lower central spine chord Node: (cx, cy, cz - depth)
        const spineNode: [number, number, number] = [cx, cy, cz - p.depth];
        
        // Push lines coordinates
        for (let i = 0; i < 6; i++) {
          const outerNode = localVerts[i];
          lines.push({
            start: outerNode,
            end: spineNode,
            color: '#475569' // slate grey strut
          });
        }

        // Draw horizontal connection chords between the lower spine nodes
        if (r > 0 && h > 0) {
          // Connect active to previous spine node
          const prevAngle = ((h - 1) * (2 * Math.PI)) / numHexes;
          const pcx = r * cellRadius * Math.sin(60 * Math.PI / 180) * Math.cos(prevAngle);
          const pcy = r * cellRadius * Math.sin(60 * Math.PI / 180) * Math.sin(prevAngle);
          const pcz = (1.0 - Math.min(1.0, Math.sqrt(pcx * pcx + pcy * pcy) / (p.span * 0.6)) ** 2) * p.sag;
          lines.push({
            start: spineNode,
            end: [pcx, pcy, pcz - p.depth],
            color: '#c084fc' // violet lower chords
          });
        }

        vIdx += 12;
      }
    }

    timings.push({ id: 'hex_grid_ops', name: 'Hexagonal Stagger Cell Subdivision', timeMs: (Date.now() - tStart) * 0.4 });
    timings.push({ id: 'truss_extrusion', name: 'Underhung Truss Truss Core Solver', timeMs: (Date.now() - tStart) * 0.35 });
    timings.push({ id: 'mesh_cap', name: 'Double-side Quad Tessellation / Cap', timeMs: (Date.now() - tStart) * 0.25 });

  } else if (modelType === 'bridge') {
    graphName = 'suspension_arch_truss_weaver.gh';
    const tStart = Date.now();

    const p = params.bridge ?? {
      bridgeSpan: 50,
      archHeight: 14,
      deckWidth: 6,
      cableCount: 16,
      archTwist: 8
    };

    timings.push({ id: 'hops_inputs', name: 'Bridge Parameter Bindings', timeMs: 0.5 });

    // Deck mesh structure: planar deck along long X-axis
    // Spanned from -span/2 to span/2
    const segments = Math.max(8, Math.min(100, p.cableCount * 2));
    const stepL = p.bridgeSpan / segments;
    const dy = p.deckWidth / 2;

    timings.push({ id: 'deck_generator', name: 'Horizontal Deck Extrusion Mesh', timeMs: 1.5 });

    let vIdx = 0;

    // Generate Deck vertices: long rectangular grid
    for (let i = 0; i <= segments; i++) {
      const px = i * stepL - p.bridgeSpan / 2;

      // Two deck edge joints
      vertices.push(px, -dy, 0); // Deck Left
      vertices.push(px, dy, 0);  // Deck Right

      let colorFactor = 0.5;
      if (analysisType === 'stress') {
        // Highest bending moment stress in center of span
        const centerRatio = 1.0 - Math.abs(px / (p.bridgeSpan / 2));
        colorFactor = centerRatio * 0.8 + 0.1;
      } else if (analysisType === 'solar') {
        colorFactor = 0.6; // mostly flat deck
      } else {
        colorFactor = 0.2; // uniform concrete cost
      }

      const [rgbR, rgbG, rgbB] = getColorForValue(colorFactor);
      colors.push(rgbR, rgbG, rgbB, rgbR, rgbG, rgbB);

      if (i < segments) {
        // Construct two triangle faces for deck slot
        indices.push(vIdx, vIdx + 1, vIdx + 3);
        indices.push(vIdx, vIdx + 3, vIdx + 2);
      }
      vIdx += 2;
    }

    const deckVCount = vIdx;

    // Generate Supporting Suspended Arches (Parabolic math)
    // Left arch and Right arch, leaning outwards/inwards based on archTwist
    const twistRad = (p.archTwist * Math.PI) / 180;
    const archPointsLeft: [number, number, number][] = [];
    const archPointsRight: [number, number, number][] = [];

    const numArchSegs = 40;
    const stepArch = p.bridgeSpan / numArchSegs;

    for (let i = 0; i <= numArchSegs; i++) {
      const px = i * stepArch - p.bridgeSpan / 2;
      
      // Parabolic y arc height
      const t = px / (p.bridgeSpan / 2);
      const az = (1.0 - t * t) * p.archHeight;

      // Lean arch outwards depending on elevation height az
      const leanOffset = az * Math.sin(twistRad);

      const pLeft: [number, number, number] = [px, -dy - leanOffset, az];
      const pRight: [number, number, number] = [px, dy + leanOffset, az];

      archPointsLeft.push(pLeft);
      archPointsRight.push(pRight);
    }

    // Convert arch points to tubes/lines or thick bars in mesh geometry
    // To make it highlight beautifully in Three.js, let's represent arches as thicker meshes (or add to line list)
    // We can add continuous structural frame lines for high visual impact
    for (let i = 0; i < numArchSegs; i++) {
      lines.push({ start: archPointsLeft[i], end: archPointsLeft[i + 1], color: '#f43f5e' }); // rose arch lines
      lines.push({ start: archPointsRight[i], end: archPointsRight[i + 1], color: '#f43f5e' });
    }

    // Add visual bracing struts between the arches (Truss system)
    for (let i = 1; i < numArchSegs; i += 2) {
      lines.push({ start: archPointsLeft[i], end: archPointsRight[i], color: '#fda4af' }); // horizontal pink strut
      // cross bracing
      if (i + 1 < numArchSegs) {
        lines.push({ start: archPointsLeft[i], end: archPointsRight[i + 1], color: '#fda4af' });
      }
    }

    timings.push({ id: 'arch_weaver', name: 'Parabolic Dual Arch Weaver', timeMs: 1.8 });

    // Hanging cables linking arches to deck boundaries
    // We hang cables spaced out along the cableCount
    const cableCount = Math.max(3, p.cableCount);
    for (let c = 0; c < cableCount; c++) {
      const ratio = (c + 1) / (cableCount + 1); // avoids edge point singularities
      const px = ratio * p.bridgeSpan - p.bridgeSpan / 2;

      // Arch attachment coordinates
      const t = px / (p.bridgeSpan / 2);
      const az = (1.0 - t * t) * p.archHeight;
      const leanOffset = az * Math.sin(twistRad);

      const archNodeL: [number, number, number] = [px, -dy - leanOffset, az];
      const archNodeR: [number, number, number] = [px, dy + leanOffset, az];

      // Deck attachment coordinates
      const deckNodeL: [number, number, number] = [px, -dy, 0];
      const deckNodeR: [number, number, number] = [px, dy, 0];

      // Hanging vertical cable ropes
      lines.push({ start: archNodeL, end: deckNodeL, color: '#e2e8f0' }); // clean cable grey
      lines.push({ start: archNodeR, end: deckNodeR, color: '#e2e8f0' });
    }

    timings.push({ id: 'cable_networks', name: 'Tension Cable Network Solver', timeMs: 1.0 });
    timings.push({ id: 'deflection_load', name: 'Bending Moment Finite Element Simulator', timeMs: 2.1 });
  } else if (modelType === 'configurator') {
    graphName = 'web_configurator.gh';
    const tStart = Date.now();
    
    // Default params if not provided
    const dp = params.dynamicParams || {};
    const popCount = dp.PopulationCount !== undefined ? dp.PopulationCount : 10;
    const offsetDist = dp.OffsetDistance !== undefined ? dp.OffsetDistance : 500;
    const minXSize = 100;
    const maxXSize = dp.MaxXSize !== undefined ? dp.MaxXSize : 3000;
    const minYSize = 100;
    const maxYSize = dp.MaxYSize !== undefined ? dp.MaxYSize : 4000;
    const minExtrudeZ = dp.MinExtrudeZ !== undefined ? dp.MinExtrudeZ : 3000;
    const maxExtrudeZ = dp.MaxExtrudeZ !== undefined ? dp.MaxExtrudeZ : 6000;
    const minMoveZ = dp.MinMoveZ !== undefined ? dp.MinMoveZ : 0;
    const maxMoveZ = dp.MaxMoveZ !== undefined ? dp.MaxMoveZ : 5000;
    const rotationAngle = dp.RotationAngle !== undefined ? dp.RotationAngle : 45;
    
    timings.push({ id: 'hops_inputs', name: 'Dynamic Params Parsing', timeMs: 0.5 });
    
    let vIdx = 0;
    
    // Generate simple towers in a circle
    const angleStep = (2 * Math.PI) / popCount;
    for (let c = 0; c < popCount; c++) {
        const theta = c * angleStep;
        
        // Base center location
        const rad = popCount * offsetDist * 0.15; // expand radius as popCount grows
        const cx = Math.cos(theta) * rad;
        const cy = Math.sin(theta) * rad;
        
        // Random dimensions (pseudo-random based on index)
        const pseudoRand = (val: number) => Math.abs(Math.sin(val * 12.9898 + 78.233)) * 43758.5453 % 1;
        const xSize = minXSize + (maxXSize - minXSize) * pseudoRand(c + 1);
        const ySize = minYSize + (maxYSize - minYSize) * pseudoRand(c + 2);
        
        const extrudeZ = minExtrudeZ + (maxExtrudeZ - minExtrudeZ) * pseudoRand(c + 3);
        const moveZ = minMoveZ + (maxMoveZ - minMoveZ) * pseudoRand(c + 4);
        
        // Box origin
        const startZ = moveZ;
        const endZ = startZ + extrudeZ;
        
        // Rotation (twist around its local Z axis)
        const twistRad = rotationAngle * Math.PI / 180 + pseudoRand(c) * 0.5;
        
        // 8 points for a box
        const xHalf = xSize / 2;
        const yHalf = ySize / 2;
        
        const signs = [
            [-1, 1],
            [1, 1],
            [1, -1],
            [-1, -1]
        ];
        
        const localVerts: [number, number, number][] = [];
        
        for (const iz of [startZ, endZ]) {
            for (const [sx, sy] of signs) {
                const lx = sx * xHalf;
                const ly = sy * yHalf;
                
                // Rotated
                const rx = lx * Math.cos(twistRad) - ly * Math.sin(twistRad);
                const ry = lx * Math.sin(twistRad) + ly * Math.cos(twistRad);
                
                localVerts.push([cx + rx, cy + ry, iz]);
            }
        }
        
        // Push vertices
        localVerts.forEach(v => vertices.push(...v));
        
        // Compute color
        // color by height
        const colorFactor = extrudeZ / (maxExtrudeZ || 1);
        const [rgbR, rgbG, rgbB] = getColorForValue(colorFactor * 1.5 - 0.2); // stretch value
        
        for (let j = 0; j < 8; j++) {
            colors.push(rgbR, rgbG, rgbB);
        }
        
        // Faces
        const f = vIdx;
        const panelIndices = [
            // Bottom face
            f + 3, f + 2, f + 1,
            f + 3, f + 1, f + 0,
            // Top face
            f + 4, f + 5, f + 6,
            f + 4, f + 6, f + 7,
            // Front face
            f + 0, f + 1, f + 5,
            f + 0, f + 5, f + 4,
            // Right face
            f + 1, f + 2, f + 6,
            f + 1, f + 6, f + 5,
            // Back face
            f + 2, f + 3, f + 7,
            f + 2, f + 7, f + 6,
            // Left face
            f + 3, f + 0, f + 4,
            f + 3, f + 4, f + 7
        ];
        indices.push(...panelIndices);
        vIdx += 8;
        
        // Add a vertical core line
        lines.push({ start: [cx, cy, startZ], end: [cx, cy, endZ], color: '#cbd5e1' });
    }
    
    timings.push({ id: 'polar_array_extrude', name: 'Polar Array & Z Extrusion', timeMs: (Date.now() - tStart) * 0.8 });
  }

  const duration = Date.now() - start;

  // Compile full structured Rhino Hops API Response Mock
  return {
    request: {
      endpoint: `http://localhost:3000/api/compute?modelType=${modelType}`,
      params: {
        modelType,
        analysisType,
        sunAngle,
        ...(modelType === 'facade' ? { facadeParams: params.facade } : {}),
        ...(modelType === 'canopy' ? { canopyParams: params.canopy } : {}),
        ...(modelType === 'bridge' ? { bridgeParams: params.bridge } : {}),
        ...(modelType === 'configurator' ? { dynamicParams: params.dynamicParams } : {})
      }
    },
    grasshopperGraph: graphName,
    solverTimeMs: Math.max(2, duration),
    data: {
      mesh: {
        vertices,
        indices,
        colors
      },
      lines: lines.length > 0 ? lines : undefined,
      telemetry: {
        total: Math.max(2, duration),
        nodes: [
          ...timings,
          { id: 'json_serialize', name: 'RhinoCommon Mesh Web Serializer', timeMs: 0.9 }
        ],
        warnings
      }
    }
  };
}
