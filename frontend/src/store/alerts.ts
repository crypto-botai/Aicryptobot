import { create } from 'zustand';
import type { Alert } from '@/types';

interface AlertStore {
  alerts: Alert[];
  unreadCount: number;
  addAlert: (alert: Alert) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  setAlerts: (alerts: Alert[]) => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  alerts: [],
  unreadCount: 0,

  addAlert: (alert) => set((s) => ({
    alerts: [alert, ...s.alerts].slice(0, 100),
    unreadCount: s.unreadCount + 1,
  })),

  markRead: (id) => set((s) => ({
    alerts: s.alerts.map((a) => a.id === id ? { ...a, isRead: true } : a),
    unreadCount: Math.max(0, s.unreadCount - 1),
  })),

  markAllRead: () => set((s) => ({
    alerts: s.alerts.map((a) => ({ ...a, isRead: true })),
    unreadCount: 0,
  })),

  setAlerts: (alerts) => set({
    alerts,
    unreadCount: alerts.filter((a) => !a.isRead).length,
  }),
}));
