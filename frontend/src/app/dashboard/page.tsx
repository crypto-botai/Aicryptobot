'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, DollarSign, Target,
  Zap, Brain, Activity, AlertTriangle, Bot, BarChart3,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { formatUSD, formatPercent, pnlClass, cn } from '@/lib/utils';
import type { PortfolioSnapshot, BotStats, AIInsight, PerformanceMetrics } from '@/types';
import { AIInsightPanel } from '@/components/ai/AIInsightPanel';
import { PortfolioChart } from '@/components/charts/PortfolioChart';
import { ActiveBotsList } from '@/components/dashboard/ActiveBotsList';
import { RecentTradesTable } from '@/components/dashboard/RecentTradesTable';
import { AIConfidenceMeter } from '@/components/ai/AIConfidenceMeter';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function DashboardPage() {
  const { data: portfolio } = useQuery<PortfolioSnapshot>({
    queryKey: ['portfolio'],
    queryFn: () => api.get('/portfolio/snapshot').then((r) => r.data),
    refetchInterval: 15_000,
  });

  const { data: metrics } = useQuery<PerformanceMetrics>({
    queryKey: ['metrics', '30d'],
    queryFn: () => api.get('/analytics/performance?period=30d').then((r) => r.data),
  });

  const { data: insights } = useQuery<AIInsight[]>({
    queryKey: ['ai-insights'],
    queryFn: () => api.get('/ai/insights?limit=5').then((r) => r.data),
    refetchInterval: 60_000,
  });

  const statsCards = [
    {
      label: 'Portfolio Value',
      value: formatUSD(portfolio?.totalValue ?? 0),
      change: formatPercent(portfolio?.totalPnLPercent ?? 0),
      positive: (portfolio?.totalPnLPercent ?? 0) >= 0,
      icon: DollarSign,
      color: 'text-brand-400',
      bg: 'from-brand-500/20 to-brand-900/5',
    },
    {
      label: '24h PnL',
      value: formatUSD(portfolio?.dayPnL ?? 0),
      change: formatPercent(portfolio?.dayPnLPercent ?? 0),
      positive: (portfolio?.dayPnLPercent ?? 0) >= 0,
      icon: portfolio?.dayPnL ?? 0 >= 0 ? TrendingUp : TrendingDown,
      color: (portfolio?.dayPnL ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400',
      bg: (portfolio?.dayPnL ?? 0) >= 0 ? 'from-emerald-500/20 to-emerald-900/5' : 'from-rose-500/20 to-rose-900/5',
    },
    {
      label: 'Win Rate',
      value: `${(metrics?.winRate ?? 0).toFixed(1)}%`,
      change: `${metrics?.totalTrades ?? 0} trades`,
      positive: (metrics?.winRate ?? 0) >= 50,
      icon: Target,
      color: 'text-gold-400',
      bg: 'from-yellow-500/20 to-yellow-900/5',
    },
    {
      label: 'Sharpe Ratio',
      value: (metrics?.sharpeRatio ?? 0).toFixed(2),
      change: `Max DD: ${formatPercent(metrics?.maxDrawdown ?? 0)}`,
      positive: (metrics?.sharpeRatio ?? 0) >= 1,
      icon: BarChart3,
      color: 'text-purple-400',
      bg: 'from-purple-500/20 to-purple-900/5',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trading Dashboard</h1>
          <p className="text-sm text-slate-400">Real-time portfolio overview with AI market intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="badge-success">
            <Activity className="h-3 w-3" />
            Live Trading Active
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((card) => (
          <div key={card.label} className="glass-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{card.value}</p>
                <p className={cn('mt-1 text-xs', card.positive ? 'text-emerald-400' : 'text-rose-400')}>
                  {card.change}
                </p>
              </div>
              <div className={cn('rounded-xl bg-gradient-to-br p-2.5', card.bg)}>
                <card.icon className={cn('h-5 w-5', card.color)} />
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Portfolio Chart */}
        <motion.div variants={itemVariants} className="xl:col-span-2">
          <div className="glass-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Portfolio Performance</h2>
              <div className="flex gap-2">
                {['1d', '7d', '30d', '90d', '1y'].map((p) => (
                  <button key={p} className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white data-[active]:bg-brand-500/20 data-[active]:text-brand-400">
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <PortfolioChart />
          </div>
        </motion.div>

        {/* AI Insight Panel */}
        <motion.div variants={itemVariants}>
          <AIInsightPanel insights={insights ?? []} />
        </motion.div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Active Bots */}
        <motion.div variants={itemVariants}>
          <div className="glass-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-brand-400" />
                <h2 className="text-base font-semibold text-white">Active Bots</h2>
              </div>
              <a href="/dashboard/bots" className="text-xs text-brand-400 hover:text-brand-300">View all</a>
            </div>
            <ActiveBotsList />
          </div>
        </motion.div>

        {/* Recent Trades */}
        <motion.div variants={itemVariants}>
          <div className="glass-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-semibold text-white">Recent Trades</h2>
              </div>
              <a href="/trading" className="text-xs text-brand-400 hover:text-brand-300">View all</a>
            </div>
            <RecentTradesTable />
          </div>
        </motion.div>
      </div>

      {/* AI Confidence Overview */}
      <motion.div variants={itemVariants}>
        <AIConfidenceMeter />
      </motion.div>
    </motion.div>
  );
}
