import React, { useState } from 'react';
import { X, Plus, Server } from 'lucide-react';
import { AddMonitorFormData } from '../types';
import { DEFAULT_CHECK_INTERVAL } from '../constants';

interface AddMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: AddMonitorFormData) => void;
}

const AddMonitorModal: React.FC<AddMonitorModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [urls, setUrls] = useState('');
  const [interval, setInterval] = useState(DEFAULT_CHECK_INTERVAL);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ urls, interval });
    setUrls('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl transform transition-all">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-400" />
            Add Monitors
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="monitor-urls" className="block text-sm font-medium text-slate-300 mb-2">
              URLs (One per line)
            </label>
            <textarea
              id="monitor-urls"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder={`https://google.com\nhttps://example.com\nmy-personal-site.com`}
              className="w-full h-40 bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none font-mono"
              required
            />
            <p className="mt-2 text-xs text-slate-500 flex items-start gap-1">
              <Server size={12} className="mt-0.5 flex-shrink-0" />
              Monitoring will run in the background on the server.
            </p>
          </div>

          <div>
            <label htmlFor="monitor-interval" className="block text-sm font-medium text-slate-300 mb-2">
              Check Interval (seconds)
            </label>
            <input
              id="monitor-interval"
              type="number"
              min="10"
              max="3600"
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
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
              className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20"
            >
              Start Monitoring
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMonitorModal;