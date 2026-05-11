'use client';

import { motion } from 'framer-motion';
import { Server, Cpu, HardDrive, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Health {
  cpu: number;
  memory: number;
  latency: number;
}

interface Props {
  health?: Health;
}

export function ServerHealthPanel({ health }: Props) {
  const metrics = [
    { label: 'CPU Usage', value: health?.cpu ?? 0, unit: '%', icon: Cpu, threshold: 80 },
    { label: 'Memory', value: health?.memory ?? 0, unit: '%', icon: HardDrive, threshold: 85 },
    { label: 'API Latency', value: health?.latency ?? 0, unit: 'ms', icon: Zap, threshold: 500, isLatency: true },
  ];

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Server className="h-5 w-5 text-brand-400" />
        <h2 className="text-base font-semibold text-white">Server Health</h2>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          All Systems Operational
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {metrics.map((m) => {
          const isOk = m.isLatency ? m.value < m.threshold : m.value < m.threshold;
          const pct = m.isLatency ? Math.min((m.value / 1000) * 100, 100) : m.value;

          return (
            <div key={m.label} className="rounded-xl border border-white/5 bg-white/3 p-4">
              <div className="flex items-center gap-2 mb-3">
                <m.icon className={cn('h-4 w-4', isOk ? 'text-emerald-400' : 'text-rose-400')} />
                <span className="text-xs text-slate-400">{m.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {m.value.toFixed(m.isLatency ? 0 : 1)}<span className="text-sm font-normal text-slate-500 ml-1">{m.unit}</span>
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                <motion.div
                  className={cn('h-full rounded-full', isOk ? 'bg-emerald-500' : 'bg-rose-500')}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
