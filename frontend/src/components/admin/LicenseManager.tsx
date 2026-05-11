'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Copy, Ban, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import type { License, LicensePlan } from '@/types';

const schema = z.object({
  plan: z.enum(['monthly', 'quarterly', 'biannual', 'annual', 'enterprise']),
  userEmail: z.string().email().optional(),
  maxDevices: z.number().int().min(1).max(10).default(1),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const PLAN_LABELS: Record<LicensePlan, { label: string; price: string; duration: string }> = {
  monthly: { label: 'Monthly', price: '$49', duration: '30 days' },
  quarterly: { label: '3 Months', price: '$129', duration: '90 days' },
  biannual: { label: '6 Months', price: '$229', duration: '180 days' },
  annual: { label: 'Annual', price: '$399', duration: '365 days' },
  enterprise: { label: 'Enterprise', price: 'Custom', duration: 'Custom' },
};

export function LicenseManager() {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data: licenses } = useQuery<License[]>({
    queryKey: ['admin', 'licenses'],
    queryFn: () => api.get('/admin/licenses?limit=20').then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { plan: 'monthly', maxDevices: 1 },
  });

  const createLicense = useMutation({
    mutationFn: (data: FormData) => api.post<{ key: string }>('/admin/licenses', data).then((r) => r.data),
    onSuccess: (data) => {
      toast.success(`License key: ${data.key}`);
      navigator.clipboard.writeText(data.key).catch(() => {});
      qc.invalidateQueries({ queryKey: ['admin', 'licenses'] });
      reset();
      setShowForm(false);
    },
    onError: () => toast.error('Failed to create license'),
  });

  const revokeLicense = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/licenses/${id}/revoke`),
    onSuccess: () => {
      toast.success('License revoked');
      qc.invalidateQueries({ queryKey: ['admin', 'licenses'] });
    },
  });

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(!showForm)} className="btn-primary w-full gap-2 text-sm">
        <Plus className="h-4 w-4" />
        Generate License Key
      </button>

      {/* Create form */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={handleSubmit((d) => createLicense.mutate(d))}
          className="space-y-3 rounded-xl border border-white/10 bg-white/3 p-4"
        >
          <div>
            <label className="mb-1 block text-xs text-slate-400">Plan</label>
            <select {...register('plan')} className="input-field py-2">
              {Object.entries(PLAN_LABELS).map(([key, val]) => (
                <option key={key} value={key}>{val.label} — {val.price} / {val.duration}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Assign to Email (optional)</label>
            <input {...register('userEmail')} type="email" placeholder="user@example.com" className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Max Devices</label>
            <input {...register('maxDevices', { valueAsNumber: true })} type="number" min={1} max={10} className="input-field" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={createLicense.isPending} className="btn-primary flex-1 text-sm">
              {createLicense.isPending ? 'Generating...' : 'Generate'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 text-sm">
              Cancel
            </button>
          </div>
        </motion.form>
      )}

      {/* License list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {licenses?.map((lic) => (
          <div key={lic.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/3 p-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <code className="text-xs font-mono text-slate-300 truncate">{lic.key}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(lic.key).then(() => toast.success('Copied!'))}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('text-xs', lic.status === 'active' ? 'text-emerald-400' : 'text-slate-500')}>
                  {lic.plan} · {lic.status}
                </span>
                <span className="text-xs text-slate-600">
                  Expires {new Date(lic.expiresAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            {lic.status === 'active' && (
              <button
                onClick={() => revokeLicense.mutate(lic.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/40"
                title="Revoke"
              >
                <Ban className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
