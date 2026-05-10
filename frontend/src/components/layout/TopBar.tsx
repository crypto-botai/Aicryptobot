'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Activity, Wifi, WifiOff } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAlertStore } from '@/store/alerts';
import { cn } from '@/lib/utils';

export function TopBar() {
  const { isConnected } = useWebSocket();
  const { unreadCount, alerts } = useAlertStore();
  const [showAlerts, setShowAlerts] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between border-b border-white/5 bg-dark-900/60 px-6 backdrop-blur-xl">
      {/* Left: search */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search markets, bots..."
          className="input-field py-2 pl-9 text-xs"
        />
      </div>

      {/* Right: status, alerts */}
      <div className="flex items-center gap-4">
        {/* WS status */}
        <div className={cn('flex items-center gap-1.5 text-xs', isConnected ? 'text-emerald-400' : 'text-rose-400')}>
          {isConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          <span className="hidden sm:block">{isConnected ? 'Live' : 'Offline'}</span>
          {isConnected && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          )}
        </div>

        {/* Market activity indicator */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Activity className="h-3.5 w-3.5 text-brand-400" />
          <span className="hidden sm:block">Markets Open</span>
        </div>

        {/* Alerts */}
        <div className="relative">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-slate-400 transition-colors hover:text-white"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showAlerts && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="glass-card absolute right-0 top-12 w-80 p-4 shadow-glass z-50"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Alerts</h3>
                  <button className="text-xs text-brand-400 hover:text-brand-300">Mark all read</button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {alerts.slice(0, 10).map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        'rounded-lg p-3 text-xs',
                        !alert.isRead && 'border-l-2 border-brand-500',
                        alert.severity === 'critical' ? 'bg-rose-500/10' :
                        alert.severity === 'warning' ? 'bg-yellow-500/10' : 'bg-white/3'
                      )}
                    >
                      <p className="font-medium text-slate-200">{alert.title}</p>
                      <p className="mt-0.5 text-slate-400">{alert.message}</p>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <p className="text-center text-xs text-slate-500 py-4">No alerts</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
