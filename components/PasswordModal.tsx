import React, { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';

interface PasswordModalProps {
  onSubmit: (password: string) => boolean;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ onSubmit }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = onSubmit(password);
    if (!isValid) {
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl transform transition-all">
        <div className="p-6">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600/20 p-4 rounded-full">
              <Lock className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Weble Uptime
          </h2>
          <p className="text-slate-400 text-center mb-6">
            Enter password to access
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Password"
                className={`w-full bg-slate-900/50 border ${error ? 'border-rose-500' : 'border-slate-600'} rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors`}
                autoFocus
              />
              {error && (
                <div className="mt-2 flex items-center gap-2 text-rose-400 text-sm">
                  <AlertCircle size={14} />
                  <span>Incorrect password</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;

