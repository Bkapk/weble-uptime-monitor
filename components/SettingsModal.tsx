import React, { useState, useEffect } from 'react';
import { X, Settings, Save } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInterval: number;
  onSave: (interval: number) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentInterval, onSave }) => {
  const [interval, setInterval] = useState(currentInterval);

  useEffect(() => {
    setInterval(currentInterval);
  }, [currentInterval, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(interval);
    onClose();
  };

  const formatInterval = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} min` : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}${secs > 0 ? ` ${secs}s` : ''}`;
    }
    return `${secs} second${secs > 1 ? 's' : ''}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl transform transition-all">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            Global Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="global-interval" className="block text-sm font-medium text-slate-300 mb-3">
              Check Interval for All Monitors
            </label>
            <input
              id="global-interval"
              type="number"
              min="60"
              max="86400"
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="mt-2 text-xs text-slate-400">
              Current: <span className="font-medium text-blue-400">{formatInterval(interval)}</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Min: 60 seconds, Max: 86400 seconds (24 hours)
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Quick Presets</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setInterval(300)}
                className="px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
              >
                5 minutes
              </button>
              <button
                type="button"
                onClick={() => setInterval(900)}
                className="px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
              >
                15 minutes
              </button>
              <button
                type="button"
                onClick={() => setInterval(1800)}
                className="px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
              >
                30 minutes
              </button>
              <button
                type="button"
                onClick={() => setInterval(3600)}
                className="px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
              >
                1 hour
              </button>
              <button
                type="button"
                onClick={() => setInterval(7200)}
                className="px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
              >
                2 hours
              </button>
              <button
                type="button"
                onClick={() => setInterval(21600)}
                className="px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
              >
                6 hours
              </button>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20"
            >
              <Save size={16} />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;

