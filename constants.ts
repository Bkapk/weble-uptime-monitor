export const DEFAULT_CHECK_INTERVAL = 3600; // seconds (1 hour)
export const MAX_HISTORY_LENGTH = 30;
export const LOCAL_STORAGE_KEY = 'weble_uptime_monitors_v1';

// Colors for status
export const STATUS_COLORS = {
  UP: 'text-emerald-400',
  DOWN: 'text-rose-500',
  PENDING: 'text-slate-400',
  PAUSED: 'text-amber-400',
};

export const STATUS_BG_COLORS = {
  UP: 'bg-emerald-500/10 border-emerald-500/20',
  DOWN: 'bg-rose-500/10 border-rose-500/20',
  PENDING: 'bg-slate-500/10 border-slate-500/20',
  PAUSED: 'bg-amber-500/10 border-amber-500/20',
};