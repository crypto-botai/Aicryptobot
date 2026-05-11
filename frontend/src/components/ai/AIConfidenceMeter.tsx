'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Brain, Shield, TrendingUp, BarChart2, Newspaper, Globe, Zap, Cpu, Star, Network } from 'lucide-react';
import api from '@/lib/api/client';
import type { AIValidationResult } from '@/types';

const PROVIDER_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  claude:     { icon: Brain,     label: 'Claude 3.5',          color: 'text-purple-400' },
  gpt:        { icon: Globe,     label: 'GPT-4o',              color: 'text-emerald-400' },
  gemini:     { icon: Star,      label: 'Gemini 1.5',          color: 'text-blue-400' },
  deepseek:   { icon: Zap,       label: 'DeepSeek',            color: 'text-cyan-400' },
  groq:       { icon: Cpu,       label: 'Groq Llama 3.1',      color: 'text-orange-400' },
  openrouter: { icon: Network,   label: 'Mistral (OpenRouter)', color: 'text-pink-400' },
  nvidia:     { icon: Cpu,       label: 'NVIDIA NIM',          color: 'text-green-400' },
  technical:  { icon: BarChart2, label: 'Technical AI',        color: 'text-indigo-400' },
  risk:       { icon: Shield,    label: 'Risk AI',             color: 'text-rose-400' },
  news:       { icon: Newspaper, label: 'News Sentiment',      color: 'text-amber-400' },
};

export function AIConfidenceMeter() {
  const { data } = useQuery<AIValidationResult>({
    queryKey: ['ai-market-confidence'],
    queryFn: () => api.get('/ai/market-sentiment').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const overallConfidence = data?.overallConfidence ?? 0;
  const validations = data?.validations ?? [];
  const pct = Math.round(overallConfidence * 100);

  const ringColor =
    overallConfidence >= 0.75 ? '#10b981' :
    overallConfidence >= 0.5  ? '#f59e0b' : '#f43f5e';

  const circumference = 2 * Math.PI * 50;

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Brain className="h-5 w-5 text-purple-400" />
        <h2 className="text-base font-semibold text-white">AI Multi-Model Confidence</h2>
        <span className="ml-auto text-xs text-slate-500">10 models · weighted consensus</span>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

        {/* ── Circular gauge ── */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative flex h-36 w-36 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <motion.circle
                cx="60" cy="60" r="50"
                fill="none" strokeWidth="10" strokeLinecap="round"
                stroke={ringColor}
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: (1 - overallConfidence) * circumference }}
                transition={{ duration: 1.8, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-4xl font-bold text-white">{pct}</p>
              <p className="text-xs text-slate-400 font-medium">/ 100</p>
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold text-white">Overall Confidence</p>
          <p className="mt-1 text-xs font-bold tracking-widest" style={{ color: ringColor }}>
            {data?.recommendation?.replace('_', ' ').toUpperCase() ?? 'ANALYZING…'}
          </p>

          {/* Bullish / Bearish count */}
          {validations.length > 0 && (
            <div className="mt-3 flex gap-3 text-xs">
              <span className="text-emerald-400 font-medium">
                {validations.filter(v => v.signal === 'bullish').length} bullish
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-rose-400 font-medium">
                {validations.filter(v => v.signal === 'bearish').length} bearish
              </span>
            </div>
          )}
        </div>

        {/* ── Per-model bars ── */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {validations.length === 0
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 animate-pulse">
                  <div className="h-6 w-6 rounded-lg bg-white/5 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2 w-16 rounded bg-white/5" />
                    <div className="h-1.5 w-full rounded-full bg-white/5" />
                  </div>
                </div>
              ))
            : validations.map((v, i) => {
                const meta = PROVIDER_META[v.provider] ?? PROVIDER_META['claude'];
                const Icon = meta.icon;
                const barColor =
                  v.signal === 'bullish' ? 'from-emerald-500 to-emerald-400' :
                  v.signal === 'bearish' ? 'from-rose-500 to-rose-400' :
                                           'from-slate-500 to-slate-400';
                const weightPct = Math.round((v.weight ?? 0) * 100);

                return (
                  <motion.div
                    key={v.provider}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2"
                    title={v.reasoning}
                  >
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/5 ${meta.color}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-slate-300 truncate">{meta.label}</span>
                        <div className="flex items-center gap-1.5 shrink-0 ml-1">
                          <span className={`text-[10px] px-1 py-0.5 rounded font-bold ${
                            v.signal === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                            v.signal === 'bearish' ? 'bg-rose-500/20 text-rose-400' :
                                                     'bg-slate-500/20 text-slate-400'
                          }`}>{v.signal?.toUpperCase()}</span>
                          <span className="text-xs font-semibold text-white w-8 text-right">
                            {Math.round(v.confidence * 100)}%
                          </span>
                          <span className="text-[10px] text-slate-600 w-6 text-right">{weightPct}w</span>
                        </div>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${v.confidence * 100}%` }}
                          transition={{ duration: 0.9, ease: 'easeOut', delay: i * 0.06 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
        </div>
      </div>

      {/* Latency footer */}
      {validations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-x-3 gap-y-1">
          {validations.map(v => (
            <span key={v.provider} className="text-[10px] text-slate-600">
              {PROVIDER_META[v.provider]?.label ?? v.provider}: {v.latencyMs}ms
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
