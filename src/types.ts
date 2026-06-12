/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ModelType = 'facade' | 'canopy' | 'bridge';

export type AnalysisType = 'solar' | 'stress' | 'cost';

export interface FacadeParams {
  width: number;
  height: number;
  panelWidth: number;
  panelHeight: number;
  waveAmplitude: number;
  waveFrequency: number;
  twist: number;
}

export interface CanopyParams {
  span: number;
  segments: number;
  sag: number;
  aperture: number;
  depth: number;
}

export interface BridgeParams {
  bridgeSpan: number;
  archHeight: number;
  deckWidth: number;
  cableCount: number;
  archTwist: number;
}

export interface ComputeRequest {
  modelType: ModelType;
  analysisType: AnalysisType;
  facadeParams?: FacadeParams;
  canopyParams?: CanopyParams;
  bridgeParams?: BridgeParams;
  sunAngle?: number; // 0 to 360 degrees
}

export interface ComputeResponseMesh {
  vertices: number[]; // Flat [x,y,z, x,y,z, ...]
  indices: number[];  // Taught faces [v1,v2,v3, ...]
  colors: number[];   // Color array [r,g,b, r,g,b, ...] for analysis visualizations
  normals?: number[]; // Vertex normals
}

export interface ComputeResponseLine {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
}

export interface NodeTiming {
  id: string;
  name: string;
  timeMs: number;
}

export interface ComputeResponse {
  request: {
    endpoint: string;
    params: Record<string, any>;
  };
  grasshopperGraph: string;
  solverTimeMs: number;
  data: {
    mesh: ComputeResponseMesh;
    lines?: ComputeResponseLine[];
    telemetry: {
      total: number;
      nodes: NodeTiming[];
      warnings: string[];
    };
  };
}

export interface ConsoleLog {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}
