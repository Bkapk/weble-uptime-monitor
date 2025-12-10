export enum MonitorStatus {
  UP = 'UP',
  DOWN = 'DOWN',
  PENDING = 'PENDING',
  PAUSED = 'PAUSED'
}

export interface LatencyPoint {
  timestamp: number;
  latency: number;
}

export interface Monitor {
  id: string;
  url: string;
  name: string;
  status: MonitorStatus;
  statusCode?: number; // New: HTTP status code (200, 404, etc.)
  lastChecked: number | null;
  latency: number | null;
  history: LatencyPoint[]; // Keep last 20 points for sparkline
  interval: number; // in seconds
  isPaused: boolean;
}

export interface AddMonitorFormData {
  urls: string; // bulk text
  interval: number;
}

export interface Stats {
  total: number;
  up: number;
  down: number;
  paused: number;
  avgLatency: number;
}