import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Monitor } from '../types';

interface EditMonitorModalProps {
  isOpen: boolean;
  monitor: Monitor | null;
  onClose: () => void;
  onSave: (id: string, url: string) => void;
}

const EditMonitorModal: React.FC<EditMonitorModalProps> = ({ isOpen, monitor, onClose, onSave }) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (monitor) {
      setUrl(monitor.url);
    }
  }, [monitor]);

  if (!isOpen || !monitor) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(monitor.id, url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl transform transition-all">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Save className="w-5 h-5 text-blue-400" />
            Edit Monitor
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="edit-url" className="block text-sm font-medium text-slate-300 mb-2">
              URL
            </label>
            <input
              id="edit-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full h-24 bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none font-mono"
              required
            />
            <p className="mt-2 text-xs text-slate-500">
              Check interval is controlled globally in Settings.
            </p>
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMonitorModal;

