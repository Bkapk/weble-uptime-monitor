import React from 'react';
import { Monitor, MonitorStatus, LatencyPoint } from '../types';
import { STATUS_COLORS, STATUS_BG_COLORS, MAX_HISTORY_LENGTH } from '../constants';
import { Globe, Clock, Trash2, Pause, Play, ExternalLink, RefreshCw, Hash } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface MonitorCardProps {
  monitor: Monitor;
  onRemove: (id: string) => void;
  onTogglePause: (id: string) => void;
  onManualCheck: (id: string) => void;
}

const MonitorCard: React.FC<MonitorCardProps> = ({ monitor, onRemove, onTogglePause, onManualCheck }) => {
  const statusColor = STATUS_COLORS[monitor.status];
  const cardBgColor = STATUS_BG_COLORS[monitor.status];
  
  // Prepare data for chart - ensuring we have numbers
  const chartData = monitor.history.map(h => ({
    latency: h.latency
  }));

  const formatLastChecked = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  const getStatusCodeColor = (code: number | undefined) => {
    if (!code) return 'text-slate-500';
    if (code >= 200 && code < 300) return 'text-emerald-400';
    if (code >= 300 && code < 400) return 'text-blue-400';
    if (code >= 400 && code < 500) return 'text-orange-400';
    if (code >= 500) return 'text-rose-400';
    return 'text-slate-400';
  };

  return (
    <div className={`relative group overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:shadow-lg ${cardBgColor} bg-opacity-40 hover:bg-opacity-60 bg-slate-900`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-white truncate" title={monitor.name}>
              {monitor.name}
            </h3>
            <a 
              href={monitor.url.startsWith('http') ? monitor.url : `https://${monitor.url}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-blue-400 transition-colors"
            >
              <ExternalLink size={14} />
            </a>
          </div>
          <p className="text-xs text-slate-400 truncate">{monitor.url}</p>
        </div>
        <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-bold border border-opacity-20 ${statusColor} bg-black/20`}>
          <div className={`w-2 h-2 rounded-full ${monitor.status === MonitorStatus.UP ? 'bg-emerald-400 animate-pulse' : monitor.status === MonitorStatus.DOWN ? 'bg-rose-500' : 'bg-slate-400'}`} />
          {monitor.status}
        </div>
      </div>

      {/* Sparkline */}
      <div className="h-16 w-full mb-4">
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <YAxis hide domain={['auto', 'auto']} />
              <Line 
                type="monotone" 
                dataKey="latency" 
                stroke={monitor.status === MonitorStatus.UP ? '#34d399' : '#e2e8f0'} 
                strokeWidth={2} 
                dot={false}
                isAnimationActive={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
           <div className="h-full w-full flex items-center justify-center text-xs text-slate-600 border border-dashed border-slate-700 rounded">
             Waiting for data...
           </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-700/50 pt-3 mt-auto">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 min-w-[3rem]" title="Last Response Time">
            <Clock size={12} />
            {monitor.latency ? `${monitor.latency}ms` : '-'}
          </span>
          {monitor.statusCode ? (
             <span className={`flex items-center gap-1 font-mono font-medium ${getStatusCodeColor(monitor.statusCode)}`} title="HTTP Status Code">
             <Hash size={12} />
             {monitor.statusCode}
           </span>
          ) : null}
          <span className="flex items-center gap-1" title="Last Checked">
            <RefreshCw size={12} className={monitor.status === MonitorStatus.PENDING ? "animate-spin" : ""} />
            {formatLastChecked(monitor.lastChecked)}
          </span>
        </div>
        
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <button 
            onClick={() => onManualCheck(monitor.id)}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors"
            title="Check Now"
          >
            <RefreshCw size={14} />
          </button>
          <button 
            onClick={() => onTogglePause(monitor.id)}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors"
            title={monitor.isPaused ? "Resume" : "Pause"}
          >
            {monitor.isPaused ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <button 
            onClick={() => onRemove(monitor.id)}
            className="p-1.5 hover:bg-rose-900/50 text-rose-400 rounded transition-colors"
            title="Remove Monitor"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonitorCard;