import React from 'react';
import { Stats } from '../types';
import { Activity, ArrowDownCircle, ArrowUpCircle, PauseCircle } from 'lucide-react';

interface StatsOverviewProps {
  stats: Stats;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 rounded-xl flex items-center gap-4">
        <div className="p-3 bg-blue-500/10 rounded-lg">
          <Activity className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <p className="text-sm text-slate-400">Total Monitors</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 rounded-xl flex items-center gap-4">
        <div className="p-3 bg-emerald-500/10 rounded-lg">
          <ArrowUpCircle className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm text-slate-400">Operational</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.up}</p>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 rounded-xl flex items-center gap-4">
        <div className="p-3 bg-rose-500/10 rounded-lg">
          <ArrowDownCircle className="w-6 h-6 text-rose-400" />
        </div>
        <div>
          <p className="text-sm text-slate-400">Downtime</p>
          <p className="text-2xl font-bold text-rose-400">{stats.down}</p>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 rounded-xl flex items-center gap-4">
        <div className="p-3 bg-slate-500/10 rounded-lg">
          <Activity className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <p className="text-sm text-slate-400">Avg. Latency</p>
          <p className="text-2xl font-bold text-indigo-400">
            {stats.avgLatency > 0 ? `${stats.avgLatency}ms` : '--'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;