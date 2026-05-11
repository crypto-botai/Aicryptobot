'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Play, Square, Trash2, Settings, Bot, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api/client';
import { cn, formatUSD, formatPercent } from '@/lib/utils';
import type { TradingBot, ExchangeId, StrategyType } from '@/types';

const createBotSchema = z.object({
  name: z.string().min(2, 'Name too short').max(50),
  exchangeId: z.string() as z.ZodType<ExchangeId>,
  symbol: z.string().min(3),
  strategy: z.string() as z.ZodType<StrategyType>,
  marketType: z.enum(['spot', 'futures']),
  mode: z.enum(['live', 'paper']),
  positionSize: z.number().positive(),
  positionSizeType: z.enum(['fixed', 'percentage']),
  stopLoss: z.number().min(0.1).max(50),
  takeProfit: z.number().min(0.1).max(500),
  aiConfidenceThreshold: z.number().min(50).max(99),
  maxDailyLoss: z.number().min(0.1),
  leverage: z.number().min(1).max(125).optional(),
});
type BotFormData = z.infer<typeof createBotSchema>;

const EXCHANGES: ExchangeId[] = ['binance', 'bybit', 'okx', 'kucoin', 'kraken', 'coinbase', 'bitget', 'mexc', 'gate'];
const STRATEGIES: StrategyType[] = ['scalping', 'swing', 'dca', 'grid', 'sniper', 'arbitrage'];

export default function BotsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data: bots, isLoading } = useQuery<TradingBot[]>({
    queryKey: ['bots'],
    queryFn: () => api.get('/trading/bots').then((r) => r.data),
    refetchInterval: 10_000,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BotFormData>({
    resolver: zodResolver(createBotSchema),
    defaultValues: {
      strategy: 'swing',
      marketType: 'spot',
      mode: 'paper',
      positionSizeType: 'percentage',
      positionSize: 5,
      stopLoss: 2,
      takeProfit: 4,
      aiConfidenceThreshold: 75,
      maxDailyLoss: 3,
    },
  });

  const createBot = useMutation({
    mutationFn: (data: BotFormData) => api.post('/trading/bots', data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Bot created successfully');
      qc.invalidateQueries({ queryKey: ['bots'] });
      reset();
      setShowCreate(false);
    },
    onError: () => toast.error('Failed to create bot'),
  });

  const toggleBot = useMutation({
    mutationFn: ({ id, running }: { id: string; running: boolean }) =>
      api.patch(`/trading/bots/${id}/${running ? 'stop' : 'start'}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bots'] }),
  });

  const deleteBot = useMutation({
    mutationFn: (id: string) => api.delete(`/trading/bots/${id}`),
    onSuccess: () => {
      toast.success('Bot deleted');
      qc.invalidateQueries({ queryKey: ['bots'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Trading Bots</h1>
          <p className="text-sm text-slate-400">Automated trading with multi-model AI validation</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary gap-2">
          <Plus className="h-4 w-4" />
          Create Bot
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <h2 className="mb-4 text-base font-semibold text-white">New Trading Bot</h2>
          <form onSubmit={handleSubmit((d) => createBot.mutate(d))} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Bot Name</label>
              <input {...register('name')} placeholder="My BTC Bot" className="input-field" />
              {errors.name && <p className="mt-0.5 text-xs text-rose-400">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Exchange</label>
              <select {...register('exchangeId')} className="input-field py-2">
                {EXCHANGES.map((e) => <option key={e} value={e}>{e.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Symbol</label>
              <input {...register('symbol')} placeholder="BTC/USDT" className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Strategy</label>
              <select {...register('strategy')} className="input-field py-2">
                {STRATEGIES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Market Type</label>
              <select {...register('marketType')} className="input-field py-2">
                <option value="spot">Spot</option>
                <option value="futures">Futures</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Trading Mode</label>
              <select {...register('mode')} className="input-field py-2">
                <option value="paper">Paper (Simulated)</option>
                <option value="live">Live Trading</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Position Size (%)</label>
              <input {...register('positionSize', { valueAsNumber: true })} type="number" step="0.1" className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Stop Loss (%)</label>
              <input {...register('stopLoss', { valueAsNumber: true })} type="number" step="0.1" className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Take Profit (%)</label>
              <input {...register('takeProfit', { valueAsNumber: true })} type="number" step="0.1" className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">AI Confidence Threshold (%)</label>
              <input {...register('aiConfidenceThreshold', { valueAsNumber: true })} type="number" min={50} max={99} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Max Daily Loss (%)</label>
              <input {...register('maxDailyLoss', { valueAsNumber: true })} type="number" step="0.1" className="input-field" />
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
              <button type="submit" disabled={createBot.isPending} className="btn-primary gap-2">
                <Bot className="h-4 w-4" />
                {createBot.isPending ? 'Creating...' : 'Create Bot'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Bots Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {bots?.map((bot) => (
            <motion.div
              key={bot.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card-hover p-5"
            >
              {/* Bot Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl',
                    bot.isRunning ? 'bg-emerald-500/20' : 'bg-slate-500/20'
                  )}>
                    <Bot className={cn('h-5 w-5', bot.isRunning ? 'text-emerald-400' : 'text-slate-400')} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{bot.name}</p>
                    <p className="text-xs text-slate-500">{bot.symbol} · {bot.exchangeId.toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={bot.mode === 'paper' ? 'badge-warning' : 'badge-success'}>
                    {bot.mode}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-lg bg-white/3 p-2 text-center">
                  <p className={cn('text-sm font-bold font-mono',
                    bot.stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  )}>
                    {bot.stats.totalPnL >= 0 ? '+' : ''}{bot.stats.totalPnLPercent.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500">PnL</p>
                </div>
                <div className="rounded-lg bg-white/3 p-2 text-center">
                  <p className="text-sm font-bold font-mono text-white">{bot.stats.winRate.toFixed(0)}%</p>
                  <p className="text-xs text-slate-500">Win Rate</p>
                </div>
                <div className="rounded-lg bg-white/3 p-2 text-center">
                  <p className="text-sm font-bold font-mono text-white">{bot.stats.totalTrades}</p>
                  <p className="text-xs text-slate-500">Trades</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span className="badge-info flex-shrink-0">{bot.strategy}</span>
                <span className="ml-auto text-xs text-slate-500">{bot.stats.runningDays}d running</span>
              </div>

              {/* Actions */}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => toggleBot.mutate({ id: bot.id, running: bot.isRunning })}
                  className={cn('flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all',
                    bot.isRunning
                      ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  )}
                >
                  {bot.isRunning ? <><Square className="h-3.5 w-3.5" /> Stop</> : <><Play className="h-3.5 w-3.5" /> Start</>}
                </button>
                <button
                  onClick={() => deleteBot.mutate(bot.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-500 hover:bg-rose-500/20 hover:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
