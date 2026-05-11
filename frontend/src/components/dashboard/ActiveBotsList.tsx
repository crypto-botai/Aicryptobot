'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Play, Square, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '@/lib/api/client';
import { cn, formatPercent, formatUSD } from '@/lib/utils';
import type { TradingBot } from '@/types';

export function ActiveBotsList() {
  const { data: bots, isLoading } = useQuery<TradingBot[]>({
    queryKey: ['bots', 'active'],
    queryFn: () => api.get('/trading/bots?status=running').then((r) => r.data),
    refetchInterval: 10_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl bg-white/3 p-3">
            <div className="h-9 w-9 rounded-lg bg-white/5" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-24 rounded bg-white/5" />
              <div className="h-2.5 w-16 rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!bots?.length) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-slate-500">No active bots. <a href="/dashboard/bots" className="text-brand-400 hover:text-brand-300">Create one</a></p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {bots.map((bot, i) => (
        <motion.div
          key={bot.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/3 p-3 transition-colors hover:border-white/10"
        >
          {/* Status indicator */}
          <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
            bot.isRunning ? 'bg-emerald-500/15' : 'bg-slate-500/15'
          )}>
            {bot.isRunning
              ? <Play className="h-4 w-4 text-emerald-400" />
              : <Square className="h-4 w-4 text-slate-400" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-white">{bot.name}</p>
              <span className="badge-info text-xs">{bot.strategy}</span>
            </div>
            <p className="text-xs text-slate-500">{bot.symbol} · {bot.exchangeId}</p>
          </div>

          <div className="text-right flex-shrink-0">
            <p className={cn('text-sm font-semibold font-mono',
              bot.stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
            )}>
              {formatUSD(bot.stats.totalPnL)}
            </p>
            <p className="text-xs text-slate-500">{bot.stats.winRate.toFixed(0)}% WR</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
