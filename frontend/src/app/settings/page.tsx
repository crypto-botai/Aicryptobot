'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { Save, Moon, Sun, Globe, Clock } from 'lucide-react';

const TIMEZONES = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Singapore', 'Asia/Hong_Kong'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];

export default function GeneralSettingsPage() {
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => api.get('/users/me').then(r => r.data) });
  const [form, setForm] = useState({ timezone: 'UTC', currency: 'USD', theme: 'dark', language: 'en' });
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (data: typeof form) => api.patch('/users/preferences', data),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">General Preferences</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Display Currency</label>
            <div className="relative">
              <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <select
                value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Timezone</label>
            <div className="relative">
              <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <select
                value={form.timezone}
                onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Theme</label>
            <div className="flex gap-2">
              {(['dark', 'light'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setForm(f => ({ ...f, theme: t }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors ${
                    form.theme === t
                      ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {t === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
          {saved && <span className="text-emerald-400 text-sm">Preferences saved!</span>}
          <div className="ml-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={14} />
              {saveMutation.isPending ? 'Saving…' : 'Save Preferences'}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-1">Account Info</h2>
        <p className="text-xs text-slate-500 mb-4">Your account details and plan</p>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          {[
            ['Email', profile?.email ?? '—'],
            ['Username', profile?.username ?? '—'],
            ['Role', profile?.role ?? '—'],
            ['Member Since', profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-slate-500">{label}</dt>
              <dd className="text-white font-medium mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
