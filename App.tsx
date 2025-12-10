import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Plus, Bell, BellOff, ShieldCheck, Server, Settings, RefreshCw } from 'lucide-react';
import { Monitor, MonitorStatus, AddMonitorFormData, Stats } from './types';
import { 
  fetchMonitors, 
  addMonitors, 
  deleteMonitor, 
  toggleMonitorPause, 
  triggerManualCheck,
  updateMonitor,
  requestNotificationPermission,
  checkAllMonitors,
  getSettings,
  updateSettings
} from './services/monitorService';
import StatsOverview from './components/StatsOverview';
import MonitorCard from './components/MonitorCard';
import AddMonitorModal from './components/AddMonitorModal';
import EditMonitorModal from './components/EditMonitorModal';
import PasswordModal from './components/PasswordModal';
import SettingsModal from './components/SettingsModal';

const App: React.FC = () => {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isServerConnected, setIsServerConnected] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [globalInterval, setGlobalInterval] = useState(3600);
  const [isCheckingAll, setIsCheckingAll] = useState(false);

  // Check authentication on mount and load settings
  useEffect(() => {
    const checkAuth = () => {
      const authCookie = document.cookie.split(';').find(c => c.trim().startsWith('weble_auth='));
      if (authCookie && authCookie.split('=')[1] === 'true') {
        setIsAuthenticated(true);
      }
    };
    checkAuth();
    
    // Load settings
    const loadSettings = async () => {
      try {
        const settings = await getSettings();
        setGlobalInterval(settings.globalInterval);
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    };
    loadSettings();
  }, []);

  // Check notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setNotificationsEnabled(true);
    }
  }, []);

  // Sync Data Loop (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    let isMounted = true;
    const syncData = async () => {
      try {
        const data = await fetchMonitors();
        if (isMounted) {
          setMonitors(data);
          setIsServerConnected(true);
        }
      } catch (e) {
        if (isMounted) setIsServerConnected(false);
      }
    };

    // Initial fetch
    syncData();

    // Poll backend every 2 seconds
    const interval = setInterval(syncData, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
  };

  const handleAddMonitors = async (data: AddMonitorFormData) => {
    try {
      await addMonitors(data);
      const updated = await fetchMonitors();
      setMonitors(updated);
    } catch (e) {
      console.error("Failed to add monitors", e);
      setIsServerConnected(false);
    }
  };

  const handleRemove = async (id: string) => {
    // Optimistic update
    setMonitors(prev => prev.filter(m => m.id !== id));
    await deleteMonitor(id);
  };

  const handleTogglePause = async (id: string) => {
    setMonitors(prev => prev.map(m => m.id === id ? { ...m, status: MonitorStatus.PENDING } : m));
    await toggleMonitorPause(id);
  };

  const handleManualCheck = async (id: string) => {
    setMonitors(prev => prev.map(m => m.id === id ? { ...m, status: MonitorStatus.PENDING } : m));
    await triggerManualCheck(id);
  };

  const handleEdit = (monitor: Monitor) => {
    setEditingMonitor(monitor);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (id: string, url: string) => {
    try {
      await updateMonitor(id, url, globalInterval);
      const updated = await fetchMonitors();
      setMonitors(updated);
    } catch (e) {
      console.error("Failed to update monitor", e);
      setIsServerConnected(false);
    }
  };

  const handleCheckAll = async () => {
    setIsCheckingAll(true);
    try {
      await checkAllMonitors();
      setTimeout(() => setIsCheckingAll(false), 2000);
    } catch (e) {
      console.error("Failed to check all monitors", e);
      setIsCheckingAll(false);
    }
  };

  const handleSaveSettings = async (interval: number) => {
    try {
      await updateSettings(interval);
      setGlobalInterval(interval);
    } catch (e) {
      console.error("Failed to update settings", e);
    }
  };

  const handlePasswordSubmit = (password: string) => {
    if (password === 'Weble2024.') {
      setIsAuthenticated(true);
      // Set cookie that expires in 7 days
      const expires = new Date();
      expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000));
      document.cookie = `weble_auth=true; expires=${expires.toUTCString()}; path=/`;
      return true;
    }
    return false;
  };

  // Calculated Stats
  const stats: Stats = useMemo(() => {
    const active = monitors.filter(m => !m.isPaused && m.status !== MonitorStatus.PENDING);
    const totalLatency = active.reduce((acc, curr) => acc + (curr.latency || 0), 0);
    
    return {
      total: monitors.length,
      up: monitors.filter(m => m.status === MonitorStatus.UP).length,
      down: monitors.filter(m => m.status === MonitorStatus.DOWN).length,
      paused: monitors.filter(m => m.status === MonitorStatus.PAUSED || m.isPaused).length,
      avgLatency: active.length > 0 ? Math.round(totalLatency / active.length) : 0
    };
  }, [monitors]);

  // Show password modal if not authenticated
  if (!isAuthenticated) {
    return <PasswordModal onSubmit={handlePasswordSubmit} />;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-blue-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Weble <span className="text-blue-500">Uptime</span>
            </h1>
            {!isServerConnected && (
              <span className="ml-4 px-3 py-1 bg-red-500/10 text-red-500 text-xs font-bold rounded-full border border-red-500/20 animate-pulse flex items-center gap-1">
                <Server size={12} /> Server Disconnected
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleCheckAll}
              disabled={isCheckingAll || monitors.length === 0}
              className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                isCheckingAll 
                  ? 'bg-blue-600/50 text-blue-200 cursor-not-allowed' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              title="Check all monitors now"
            >
              <RefreshCw size={16} className={isCheckingAll ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Check All</span>
            </button>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              title="Global settings"
            >
              <Settings size={16} />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={handleEnableNotifications}
              className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${notificationsEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
              <span className="hidden sm:inline">{notificationsEnabled ? 'Alerts' : 'Alerts'}</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-95"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Monitors</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <StatsOverview stats={stats} />

        {monitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/50">
            <div className="bg-slate-800 p-4 rounded-full mb-4">
              <Activity className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No monitors yet</h3>
            <p className="text-slate-400 max-w-sm text-center mb-6">
              Start tracking your websites by adding your first monitor. We support bulk adding for convenience.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Add your first monitor &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {monitors.map(monitor => (
              <MonitorCard
                key={monitor.id}
                monitor={monitor}
                onRemove={handleRemove}
                onTogglePause={handleTogglePause}
                onManualCheck={handleManualCheck}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </main>

      <AddMonitorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddMonitors}
      />

      <EditMonitorModal
        isOpen={isEditModalOpen}
        monitor={editingMonitor}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingMonitor(null);
        }}
        onSave={handleSaveEdit}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentInterval={globalInterval}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default App;