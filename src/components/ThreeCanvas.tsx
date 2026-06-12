/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ComputeResponseMesh, ComputeResponseLine } from '../types';
import { Lightbulb, Sun, Maximize2, RotateCcw } from 'lucide-react';

interface ThreeCanvasProps {
  meshData: ComputeResponseMesh | null;
  lineData: ComputeResponseLine[] | undefined;
  sunAngle: number;
  loading: boolean;
  modelType: 'facade' | 'canopy' | 'bridge';
  analysisType: 'solar' | 'stress' | 'cost';
}

export default function ThreeCanvas({
  meshData,
  lineData,
  sunAngle,
  loading,
  modelType,
  analysisType
}: ThreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // References to active 3D elements for dynamic updates
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const lineGroupRef = useRef<THREE.Group | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const sunVisualRef = useRef<THREE.Mesh | null>(null);

  const [stats, setStats] = useState({ vertices: 0, faces: 0, fps: 60 });

  // 1. Initialize Scene, Camera, WebGLRenderer, Controls, Lights
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 450;

    // Create Scene with soft blueprint or cosmic background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#09090b'); // Sleek Bento Zinc-950
    sceneRef.current = scene;

    // Add visual Fog for atmospheric depth
    scene.fog = new THREE.FogExp2('#09090b', 0.008);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(30, 25, 45);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // restrict camera below ground
    controls.minDistance = 5;
    controls.maxDistance = 150;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight('#1e293b', 1.5);
    scene.add(ambientLight);

    // Directional (Sun) Light which creates shadow mapping
    const sunLight = new THREE.DirectionalLight('#ffffff', 2.5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 150;
    const sCam = 40;
    sunLight.shadow.camera.left = -sCam;
    sunLight.shadow.camera.right = sCam;
    sunLight.shadow.camera.top = sCam;
    sunLight.shadow.camera.bottom = -sCam;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Glowing Sun sphere visual representation
    const sunGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });
    const sunVisual = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sunVisual);
    sunVisualRef.current = sunVisual;

    // Secondary subtle fill lighting (bounce light)
    const fillLight = new THREE.DirectionalLight('#38bdf8', 0.5);
    fillLight.position.set(-30, 10, -30);
    scene.add(fillLight);

    // Floor Grid (architectural grid)
    const gridHelper = new THREE.GridHelper(100, 50, '#52525b', '#18181b');
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    // Ref groups for meshes and structural lines
    const meshGroup = new THREE.Group();
    scene.add(meshGroup);
    meshGroupRef.current = meshGroup;

    const lineGroup = new THREE.Group();
    scene.add(lineGroup);
    lineGroupRef.current = lineGroup;

    // Resize handler using ResizeObserver (robust stage sizing)
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;
      const { width: w, height: h } = entries[0].contentRect;
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Interactive Animation Loop
    let lastTime = performance.now();
    let frameCount = 0;
    let animId = 0;

    const tick = () => {
      animId = requestAnimationFrame(tick);
      
      // Update camera controls
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Render
      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      // FPS tracking
      frameCount++;
      const time = performance.now();
      if (time >= lastTime + 1000) {
        setStats(prev => ({ ...prev, fps: Math.round((frameCount * 1000) / (time - lastTime)) }));
        frameCount = 0;
        lastTime = time;
      }
    };

    tick();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  // 2. Align Sun lighting when sunAngle changes
  useEffect(() => {
    if (!sunLightRef.current || !sunVisualRef.current) return;

    // Calculate angle positions
    const sunRad = (sunAngle * Math.PI) / 180;
    const r = 40; // sun orbit distance
    const x = r * Math.cos(sunRad);
    const z = r * Math.sin(sunRad);
    const y = 30; // height

    // Move physical light and visual sun sphere
    sunLightRef.current.position.set(x, y, z);
    sunVisualRef.current.position.set(x, y, z);
  }, [sunAngle]);

  // 3. Re-render dynamic geometry meshes and cables whenever meshData or lineData loaded
  useEffect(() => {
    const meshGroup = meshGroupRef.current;
    const lineGroup = lineGroupRef.current;
    if (!meshGroup || !lineGroup || !meshData) return;

    // Clear previous geometries and meshes
    while (meshGroup.children.length > 0) {
      const child = meshGroup.children[0] as THREE.Mesh;
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach(mat => mat.dispose());
      } else {
        child.material.dispose();
      }
      meshGroup.remove(child);
    }

    while (lineGroup.children.length > 0) {
      const child = lineGroup.children[0] as THREE.LineSegments;
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach(mat => mat.dispose());
      } else {
        child.material.dispose();
      }
      lineGroup.remove(child);
    }

    // A. Parse Mesh Payload
    const geometry = new THREE.BufferGeometry();
    
    // Set vertices
    const f32Verts = new Float32Array(meshData.vertices);
    geometry.setAttribute('position', new THREE.BufferAttribute(f32Verts, 3));

    // Set colors
    const f32Colors = new Float32Array(meshData.colors);
    geometry.setAttribute('color', new THREE.BufferAttribute(f32Colors, 3));

    // Set face indices
    geometry.setIndex(meshData.indices);

    // Automatically compute normal lines for standard shading
    geometry.computeVertexNormals();

    // Mesh Material (Standard glossy metal framework with DoubleSided rendering for structural skins)
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.25,
      metalness: pMatchModelMetalness(modelType),
      side: THREE.DoubleSide,
      flatShading: modelType === 'facade' // Flat retro feel for panels
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    meshGroup.add(mesh);

    // Update canvas counts
    setStats(prev => ({
      ...prev,
      vertices: meshData.vertices.length / 3,
      faces: meshData.indices.length / 3
    }));

    // B. Parse lineData for cables or frame structures
    if (lineData && lineData.length > 0) {
      // Direct raw coordinates mappings for lines
      const linePositions: number[] = [];
      const lineColors: number[] = [];

      lineData.forEach(line => {
        linePositions.push(...line.start, ...line.end);
        
        // Parse hex color string to rgb
        const col = new THREE.Color(line.color || '#475569');
        lineColors.push(col.r, col.g, col.b, col.r, col.g, col.b);
      });

      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      lineGeo.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));

      const lineMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        linewidth: 2, // supported by a few browsers, otherwise default 1
        transparent: true,
        opacity: 0.95
      });

      const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
      lineGroup.add(lineSegments);
    }

    // Reorient camera target based on model boundaries
    if (controlsRef.current) {
      if (modelType === 'bridge') {
        controlsRef.current.target.set(0, 4, 0);
      } else if (modelType === 'canopy') {
        controlsRef.current.target.set(0, 0, 0);
      } else {
        controlsRef.current.target.set(0, 0, 0);
      }
    }
  }, [meshData, lineData, modelType]);

  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(30, 25, 45);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden" id="three_viewport">
      {/* 3D Header overlay */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-3">
        <span className="flex h-2 w-2 relative">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${loading ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${loading ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
        </span>
        <span className="text-xs font-mono font-medium text-slate-300">
          {loading ? 'SOLVING GRAPH IN REAL-TIME...' : 'WebGL ACTIVE - ORBIT CONTROLS READY'}
        </span>
      </div>

      {/* Camera and action overlays */}
      <div className="absolute top-3 right-4 z-10 flex items-center gap-2">
        <button
          onClick={resetCamera}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase font-mono font-semibold bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 rounded-lg transition-all"
          title="Reset Camera View"
          id="btn_reset_camera"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Cam
        </button>
      </div>

      {/* Floating 3D graphics canvas stats */}
      <div className="absolute bottom-4 left-4 z-10 p-3.5 bg-zinc-900/90 backdrop-blur-md rounded-xl border border-zinc-800 text-[11px] font-mono whitespace-nowrap min-w-44 shadow-xl">
        <div className="w-full flex justify-between gap-4 py-0.5 border-b border-zinc-800/60 pb-1 mb-1">
          <span className="text-zinc-400">FPS Render Rate:</span>
          <span className="text-emerald-400 font-bold">{stats.fps} hz</span>
        </div>
        <div className="w-full flex justify-between gap-4 py-0.5">
          <span className="text-zinc-400">Mesh Vertices:</span>
          <span className="text-zinc-200 font-bold">{stats.vertices.toLocaleString()}</span>
        </div>
        <div className="w-full flex justify-between gap-4 py-0.5">
          <span className="text-zinc-400">Total Faces:</span>
          <span className="text-zinc-200 font-bold">{stats.faces.toLocaleString()}</span>
        </div>
        <div className="w-full flex justify-between gap-4 py-0.5 mt-1 border-t border-zinc-800/80 pt-1">
          <span className="text-zinc-400">Analysis Visual:</span>
          <span className="text-sky-400 uppercase font-bold text-[10px]">{analysisType} heatmap</span>
        </div>
      </div>

      {/* Beautiful Legend Bar for Heatmaps */}
      <div className="absolute bottom-4 right-4 z-10 p-3 bg-zinc-900/90 backdrop-blur-md rounded-xl border border-zinc-800 shadow-xl w-44">
        <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5 text-center">
          {getLegendTitle(analysisType)}
        </div>
        {/* Color stripe */}
        <div className="w-full h-3 rounded bg-gradient-to-r from-blue-600 via-green-500 via-yellow-400 to-red-500 mb-1.5"></div>
        <div className="flex justify-between text-[8px] font-mono text-zinc-500">
          <span>{getLegendMin(analysisType)}</span>
          <span>{getLegendMid(analysisType)}</span>
          <span>{getLegendMax(analysisType)}</span>
        </div>
      </div>

      {/* Ambient Canvas Element */}
      <div ref={containerRef} className="w-full h-full flex-1">
        <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" id="mesh_canvas" />
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-zinc-950/65 backdrop-blur-[1.5px] flex flex-col items-center justify-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-zinc-850 border-t-sky-400 animate-spin"></div>
            <Sun className="w-5 h-5 absolute text-sky-400 animate-pulse" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-mono font-medium text-zinc-200 tracking-widest animate-pulse">
              RUNNING RHINO.COMPUTE SOLVER
            </span>
            <span className="text-[9px] font-mono text-zinc-400 mt-1">
              Evaluating Hops socket connection...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Map metallic look based on model logic
function pMatchModelMetalness(model: string): number {
  switch (model) {
    case 'facade': return 0.6;
    case 'canopy': return 0.8;
    case 'bridge': return 0.4;
    default: return 0.5;
  }
}

function getLegendTitle(type: 'solar' | 'stress' | 'cost'): string {
  switch (type) {
    case 'solar': return 'Solar Irradiance';
    case 'stress': return 'Structural Stress';
    case 'cost': return 'Material Tooling Cost';
  }
}

function getLegendMin(type: 'solar' | 'stress' | 'cost'): string {
  switch (type) {
    case 'solar': return 'Low (Shadow)';
    case 'stress': return '0.5 MPa';
    case 'cost': return '$150/m² (Base)';
  }
}

function getLegendMid(type: 'solar' | 'stress' | 'cost'): string {
  switch (type) {
    case 'solar': return 'Medium';
    case 'stress': return '120 MPa';
    case 'cost': return '$350';
  }
}

function getLegendMax(type: 'solar' | 'stress' | 'cost'): string {
  switch (type) {
    case 'solar': return 'High (Direct)';
    case 'stress': return '340 MPa (Max)';
    case 'cost': return '$980/m² (Bespoke)';
  }
}
