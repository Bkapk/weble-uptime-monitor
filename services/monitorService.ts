import { Monitor, AddMonitorFormData } from '../types';

// Use relative path so it works on localhost, production domains, and cloud IPs automatically.
const API_BASE = '/api';

export const fetchMonitors = async (): Promise<Monitor[]> => {
  const res = await fetch(`${API_BASE}/monitors`);
  if (!res.ok) throw new Error('Failed to fetch');
  return await res.json();
};

export const addMonitors = async (data: AddMonitorFormData): Promise<void> => {
  await fetch(`${API_BASE}/monitors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

export const deleteMonitor = async (id: string): Promise<void> => {
  await fetch(`${API_BASE}/monitors/${id}`, { method: 'DELETE' });
};

export const toggleMonitorPause = async (id: string): Promise<void> => {
  await fetch(`${API_BASE}/monitors/${id}/toggle`, { method: 'PATCH' });
};

export const triggerManualCheck = async (id: string): Promise<void> => {
  await fetch(`${API_BASE}/monitors/${id}/check`, { method: 'POST' });
};

// Browser notifications for when the user has the tab open
export const sendBrowserNotification = (title: string, body: string) => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
};

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
};