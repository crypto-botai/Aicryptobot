'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, TrendingUp, BarChart3, Bot, BriefcaseBusiness,
  FlaskConical, Bell, Settings, ChevronLeft, ChevronRight, Shield,
  Cpu, Users, LogOut, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/trading', icon: TrendingUp, label: 'Trading' },
  { href: '/portfolio', icon: BriefcaseBusiness, label: 'Portfolio' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/dashboard/bots', icon: Bot, label: 'AI Bots' },
  { href: '/backtesting', icon: FlaskConical, label: 'Backtesting' },
  { href: '/dashboard/alerts', icon: Bell, label: 'Alerts' },
];

const ADMIN_ITEMS = [
  { href: '/admin', icon: Shield, label: 'Admin Panel' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/licensing', icon: Zap, label: 'Licensing' },
  { href: '/admin/ai', icon: Cpu, label: 'AI Engine' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col overflow-hidden border-r border-white/5 bg-dark-900/80 backdrop-blur-xl"
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/5 px-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 shadow-glow">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="gradient-text overflow-hidden whitespace-nowrap text-lg font-bold"
            >
              AICryptoBot
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn('sidebar-link', pathname === href && 'active')}
                title={collapsed ? label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </li>
          ))}
        </ul>

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-6">
            <button
              onClick={() => setShowAdmin(!showAdmin)}
              className={cn('sidebar-link w-full', !collapsed && 'justify-between')}
            >
              <span className="flex items-center gap-3">
                <Shield className="h-5 w-5 flex-shrink-0 text-gold-400" />
                {!collapsed && <span>Admin</span>}
              </span>
              {!collapsed && (
                <ChevronRight className={cn('h-4 w-4 transition-transform', showAdmin && 'rotate-90')} />
              )}
            </button>
            <AnimatePresence>
              {showAdmin && !collapsed && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-1 space-y-1 overflow-hidden pl-4"
                >
                  {ADMIN_ITEMS.map(({ href, icon: Icon, label }) => (
                    <li key={href}>
                      <Link href={href} className={cn('sidebar-link text-xs', pathname === href && 'active')}>
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span>{label}</span>
                      </Link>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}
      </nav>

      {/* Bottom: user + settings */}
      <div className="border-t border-white/5 p-2 space-y-1">
        <Link href="/settings" className={cn('sidebar-link', pathname === '/settings' && 'active')}>
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
        <button onClick={() => logout()} className="sidebar-link w-full text-rose-400 hover:text-rose-300">
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>

        {/* User avatar */}
        {!collapsed && user && (
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/5 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              {user.username[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-200">{user.username}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-dark-800 text-slate-400 hover:text-white"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </motion.aside>
  );
}
