'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Settings, Key, Bell, Shield, User } from 'lucide-react';

const NAV = [
  { href: '/settings', label: 'General', icon: Settings },
  { href: '/settings/exchanges', label: 'Exchanges', icon: Key },
  { href: '/settings/profile', label: 'Profile', icon: User },
  { href: '/settings/security', label: 'Security & 2FA', icon: Shield },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
        <div className="flex gap-6">
          <aside className="w-56 shrink-0">
            <nav className="glass-card p-3 space-y-1">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/settings' && pathname.startsWith(href));
                return (
                  <Link key={href} href={href}>
                    <motion.div
                      whileHover={{ x: 4 }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </motion.div>
                  </Link>
                );
              })}
            </nav>
          </aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
