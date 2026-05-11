'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIInsight } from '@/types';

interface Props {
  insights: AIInsight[];
}

const signalIcon = {
  strong_buy: TrendingUp,
  buy: TrendingUp,
  neutral: Minus,
  sell: TrendingDown,
  strong_sell: TrendingDown,
};

const signalColor = {
  strong_buy: 'text-emerald-400',
  buy: 'text-emerald-300',
  neutral: 'text-slate-400',
  sell: 'text-rose-300',
  strong_sell: 'text-rose-400',
};

export function AIInsightPanel({ insights }: Props) {
  return (
    <div className="glass-card flex h-full flex-col p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
            <Brain className="h-4 w-4 text-purple-400" />
          </div>
          <h2 className="text-base font-semibold text-white">AI Insights</h2>
        </div>
        <div className="badge-info">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
          Live
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        <AnimatePresence initial={false}>
          {insights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <RefreshCw className="mb-2 h-8 w-8 animate-spin-slow text-slate-600" />
              <p className="text-sm text-slate-500">Analyzing markets...</p>
            </div>
          ) : (
            insights.map((insight, i) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-white/5 bg-white/3 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {insight.symbol && (
                      <span className="mb-1 inline-block rounded-md bg-brand-500/20 px-2 py-0.5 text-xs font-mono font-semibold text-brand-300">
                        {insight.symbol}
                      </span>
                    )}
                    <p className="text-xs text-slate-300 leading-relaxed">{insight.content}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs font-semibold text-white">{Math.round(insight.confidence * 100)}%</span>
                    <div className="h-1 w-12 overflow-hidden rounded-full bg-slate-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500"
                        style={{ width: `${insight.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  {new Date(insight.timestamp).toLocaleTimeString()}
                </p>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
