'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Brain, Shield, TrendingUp, BarChart2, Newspaper, Globe } from 'lucide-react';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import type { AIValidationResult } from '@/types';

const MODEL_ICONS = {
  claude: Brain,
  gpt: Globe,
  gemini: TrendingUp,
  technical: BarChart2,
  risk: Shield,
  news: Newspaper,
};

export function AIConfidenceMeter() {
  const { data } = useQuery<AIValidationResult>({
    queryKey: ['ai-market-confidence'],
    queryFn: () => api.get('/ai/market-sentiment').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const overallConfidence = data?.overallConfidence ?? 0;
  const validations = data?.validations ?? [];

  const confidenceColor =
    overallConfidence >= 0.75 ? 'from-emerald-500 to-green-400' :
    overallConfidence >= 0.5  ? 'from-yellow-500 to-amber-400' :
                                 'from-rose-500 to-red-400';

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Brain className="h-5 w-5 text-purple-400" />
        <h2 className="text-base font-semibold text-white">AI Multi-Model Confidence</h2>
        <div className="ml-auto text-xs text-slate-500">Market Sentiment Analysis</div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Overall meter */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative flex h-32 w-32 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
              <motion.circle
                cx="60" cy="60" r="50"
                fill="none"
                strokeWidth="12"
                strokeLinecap="round"
                stroke="url(#gradient)"
                strokeDasharray={`${2 * Math.PI * 50}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{ strokeDashoffset: (1 - overallConfidence) * 2 * Math.PI * 50 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute text-center">
              <p className="text-3xl font-bold text-white">{Math.round(overallConfidence * 100)}</p>
              <p className="text-xs text-slate-400">/ 100</p>
            </div>
          </div>
          <p className="mt-2 text-sm font-medium text-white">Overall Confidence</p>
          <p className={cn('text-xs font-medium mt-1', overallConfidence >= 0.75 ? 'text-emerald-400' : overallConfidence >= 0.5 ? 'text-yellow-400' : 'text-rose-400')}>
            {data?.recommendation?.replace('_', ' ').toUpperCase() ?? 'ANALYZING...'}
          </p>
        </div>

        {/* Per-model validations */}
        <div className="space-y-3">
          {validations.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-7 w-7 rounded-lg bg-white/5" />
                  <div className="flex-1">
                    <div className="mb-1 h-2.5 w-20 rounded bg-white/5" />
                    <div className="h-1.5 w-full rounded-full bg-white/5" />
                  </div>
                </div>
              ))
            : validations.map((v) => {
                const Icon = MODEL_ICONS[v.provider as keyof typeof MODEL_ICONS] ?? Brain;
                return (
                  <div key={v.model} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/5">
                      <Icon className="h-3.5 w-3.5 text-brand-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-300 capitalize">{v.model}</span>
                        <span className={cn('text-xs font-semibold',
                          v.signal === 'bullish' ? 'text-emerald-400' :
                          v.signal === 'bearish' ? 'text-rose-400' : 'text-slate-400'
                        )}>
                          {Math.round(v.confidence * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                        <motion.div
                          className={cn('h-full rounded-full bg-gradient-to-r', confidenceColor)}
                          initial={{ width: 0 }}
                          animate={{ width: `${v.confidence * 100}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
