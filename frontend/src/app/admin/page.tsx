'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, Key, DollarSign, Activity, Server, Brain,
  TrendingUp, AlertTriangle, Shield, RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { formatUSD, formatNumber } from '@/lib/utils';
import { AdminUsersTable } from '@/components/admin/AdminUsersTable';
import { LicenseManager } from '@/components/admin/LicenseManager';
import { ServerHealthPanel } from '@/components/admin/ServerHealthPanel';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeLicenses: number;
  expiredLicenses: number;
  totalTrades: number;
  activeBots: number;
  serverHealth: { cpu: number; memory: number; latency: number };
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function AdminPage() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const statCards = [
    { label: 'Total Users', value: formatNumber(stats?.totalUsers ?? 0), icon: Users, color: 'text-brand-400', bg: 'from-brand-500/20' },
    { label: 'Active Licenses', value: formatNumber(stats?.activeLicenses ?? 0), icon: Key, color: 'text-gold-400', bg: 'from-yellow-500/20' },
    { label: 'Monthly Revenue', value: formatUSD(stats?.monthlyRevenue ?? 0), icon: DollarSign, color: 'text-emerald-400', bg: 'from-emerald-500/20' },
    { label: 'Active Bots', value: formatNumber(stats?.activeBots ?? 0), icon: Activity, color: 'text-purple-400', bg: 'from-purple-500/20' },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Super Admin Panel</h1>
          <p className="text-sm text-slate-400">Platform management and monitoring</p>
        </div>
        <div className="badge-warning flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" />
          Admin Access
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="glass-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{isLoading ? '—' : card.value}</p>
              </div>
              <div className={`rounded-xl bg-gradient-to-br p-2.5 ${card.bg} to-transparent`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Server Health */}
      <motion.div variants={itemVariants}>
        <ServerHealthPanel health={stats?.serverHealth} />
      </motion.div>

      {/* Users & Licenses */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <motion.div variants={itemVariants}>
          <div className="glass-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-400" />
                <h2 className="text-base font-semibold text-white">User Management</h2>
              </div>
            </div>
            <AdminUsersTable />
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="glass-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Key className="h-5 w-5 text-gold-400" />
              <h2 className="text-base font-semibold text-white">License Manager</h2>
            </div>
            <LicenseManager />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
