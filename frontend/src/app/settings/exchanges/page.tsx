'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CheckCircle2, XCircle, Trash2, Plus, Eye, EyeOff,
  AlertTriangle, ExternalLink, RefreshCw, Shield, Info,
  Wallet, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import type { ExchangeId } from '@/types';

// ─── Exchange metadata ────────────────────────────────────────────────────────

const EXCHANGES: Record<ExchangeId, {
  name: string;
  logo: string;
  color: string;
  hasPassphrase: boolean;
  apiDocsUrl: string;
  steps: string[];
  permissions: string[];
  warning?: string;
}> = {
  binance: {
    name: 'Binance',
    logo: '🟡',
    color: 'from-yellow-500/20 to-yellow-900/5',
    hasPassphrase: false,
    apiDocsUrl: 'https://www.binance.com/en/my/settings/api-management',
    steps: [
      'Log in to Binance → Profile → API Management',
      'Click "Create API" → choose "System Generated"',
      'Name it (e.g. "AICryptoBot") and click Next',
      'Complete 2FA verification',
      'Enable: "Enable Reading" + "Enable Spot & Margin Trading"',
      'Restrict IP to your server IP for extra security',
      'Copy the API Key and Secret Key below',
    ],
    permissions: ['Read', 'Spot Trading', 'Futures Trading (optional)'],
    warning: 'Never enable "Enable Withdrawals" — not needed and a security risk.',
  },
  bybit: {
    name: 'Bybit',
    logo: '🟠',
    color: 'from-orange-500/20 to-orange-900/5',
    hasPassphrase: false,
    apiDocsUrl: 'https://www.bybit.com/app/user/api-management',
    steps: [
      'Log in to Bybit → Account → API Management',
      'Click "Create New Key"',
      'Select "API Transaction" → name it "AICryptoBot"',
      'Permissions: enable "Read-Write" for Spot/Derivatives',
      'Set IP restriction (recommended)',
      'Complete 2FA → copy API Key and Secret',
    ],
    permissions: ['Read', 'Trade', 'Derivatives (optional)'],
  },
  okx: {
    name: 'OKX',
    logo: '⚫',
    color: 'from-slate-500/20 to-slate-900/5',
    hasPassphrase: true,
    apiDocsUrl: 'https://www.okx.com/account/my-api',
    steps: [
      'Log in to OKX → Profile → API',
      'Click "Create V5 API Key"',
      'Set purpose: "Trading"',
      'Set a strong Passphrase (you\'ll need this too)',
      'Permissions: Read + Trade',
      'Add IP whitelist (recommended)',
      'Copy API Key, Secret Key, and Passphrase',
    ],
    permissions: ['Read', 'Trade'],
    warning: 'OKX requires a Passphrase. Store it safely — it cannot be recovered.',
  },
  kucoin: {
    name: 'KuCoin',
    logo: '🟢',
    color: 'from-green-500/20 to-green-900/5',
    hasPassphrase: true,
    apiDocsUrl: 'https://www.kucoin.com/account/api',
    steps: [
      'Log in to KuCoin → Profile → API Management',
      'Click "Create API"',
      'Enter API name and a Passphrase',
      'Permissions: General + Trade',
      'Complete 2FA → copy all 3 values',
    ],
    permissions: ['General', 'Trade', 'Futures (optional)'],
  },
  kraken: {
    name: 'Kraken',
    logo: '🟣',
    color: 'from-purple-500/20 to-purple-900/5',
    hasPassphrase: false,
    apiDocsUrl: 'https://www.kraken.com/u/security/api',
    steps: [
      'Log in to Kraken → Settings → API',
      'Click "Add Key"',
      'Key permissions: Query Funds, Create & Modify Orders',
      'Set expiry (optional) → Generate Key',
      'Copy API Key and Private Key',
    ],
    permissions: ['Query Funds', 'Create Orders', 'Modify Orders'],
  },
  coinbase: {
    name: 'Coinbase',
    logo: '🔵',
    color: 'from-blue-500/20 to-blue-900/5',
    hasPassphrase: true,
    apiDocsUrl: 'https://www.coinbase.com/settings/api',
    steps: [
      'Log in to Coinbase Advanced → Settings → API',
      'Click "New API Key"',
      'Enable: View, Trade permissions',
      'Set a nickname → Create & Download key',
      'Note: Coinbase uses API Key + API Secret + Passphrase',
    ],
    permissions: ['View', 'Trade'],
  },
  bitget: {
    name: 'Bitget',
    logo: '🩵',
    color: 'from-cyan-500/20 to-cyan-900/5',
    hasPassphrase: true,
    apiDocsUrl: 'https://www.bitget.com/en/account/newapi',
    steps: [
      'Log in to Bitget → Profile → API Keys',
      'Click "Create API"',
      'Set label and Passphrase',
      'Permissions: Read + Trade',
      'Copy API Key, Secret, and Passphrase',
    ],
    permissions: ['Read', 'Trade'],
  },
  mexc: {
    name: 'MEXC',
    logo: '🔷',
    color: 'from-indigo-500/20 to-indigo-900/5',
    hasPassphrase: false,
    apiDocsUrl: 'https://www.mexc.com/user/openapi',
    steps: [
      'Log in to MEXC → Profile → API Management',
      'Click "Create API"',
      'Enable Trade permissions',
      'Copy API Key and Secret Key',
    ],
    permissions: ['Read', 'Trade'],
  },
  gate: {
    name: 'Gate.io',
    logo: '🔴',
    color: 'from-red-500/20 to-red-900/5',
    hasPassphrase: false,
    apiDocsUrl: 'https://www.gate.io/myaccount/apiv4keys',
    steps: [
      'Log in to Gate.io → Account → API Keys',
      'Click "Create API Key"',
      'Select "Spot Trade" permissions',
      'Copy Key and Secret',
    ],
    permissions: ['Read', 'Spot Trade', 'Futures (optional)'],
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExchangeConnection {
  id: string;
  exchangeId: ExchangeId;
  label: string;
  isActive: boolean;
  isVerified: boolean;
  permissions?: string[];
  lastVerifiedAt?: string;
  createdAt: string;
}

const addSchema = z.object({
  exchangeId: z.string() as z.ZodType<ExchangeId>,
  label: z.string().min(1).max(50).optional(),
  apiKey: z.string().min(10, 'API Key too short'),
  apiSecret: z.string().min(10, 'API Secret too short'),
  passphrase: z.string().optional(),
});
type AddFormData = z.infer<typeof addSchema>;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExchangeSettingsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<ExchangeId>('binance');
  const [showGuide, setShowGuide] = useState<ExchangeId | null>(null);
  const qc = useQueryClient();

  const { data: connections = [], isLoading } = useQuery<ExchangeConnection[]>({
    queryKey: ['exchange-connections'],
    queryFn: () => api.get('/exchange/connections').then((r) => r.data),
  });

  const addMutation = useMutation({
    mutationFn: (data: AddFormData) => api.post('/exchange/connections', data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Exchange connected successfully');
      qc.invalidateQueries({ queryKey: ['exchange-connections'] });
      setShowAdd(false);
    },
    onError: (e: Error) => toast.error(e.message ?? 'Failed to connect exchange'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/exchange/connections/${id}`),
    onSuccess: () => {
      toast.success('Exchange removed');
      qc.invalidateQueries({ queryKey: ['exchange-connections'] });
    },
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => api.post(`/exchange/connections/${id}/test`).then((r) => r.data),
    onSuccess: (data) => {
      if (data.valid) toast.success('Connection verified successfully');
      else toast.error(`Verification failed: ${data.error}`);
      qc.invalidateQueries({ queryKey: ['exchange-connections'] });
    },
  });

  const exchangeMeta = EXCHANGES[selectedExchange];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Exchange Connections</h1>
          <p className="mt-1 text-sm text-slate-400">
            Connect your exchange accounts. All API keys are encrypted with AES-256 and never exposed.
          </p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary gap-2 text-sm">
          <Plus className="h-4 w-4" />
          Add Exchange
        </button>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 rounded-xl border border-brand-500/20 bg-brand-500/10 p-4">
        <Shield className="h-5 w-5 flex-shrink-0 text-brand-400 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-brand-300">Your API keys are protected</p>
          <p className="mt-0.5 text-slate-400">
            Keys are encrypted with AES-256-CBC before storage. They are never logged, never returned in API responses,
            and only decrypted server-side at the moment of trade execution. We recommend setting <strong>IP restrictions</strong> on your exchange and <strong>disabling withdrawals</strong>.
          </p>
        </div>
      </div>

      {/* Add Exchange Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="glass-card p-6"
          >
            <h2 className="mb-5 text-base font-semibold text-white">Connect Exchange</h2>

            {/* Exchange picker */}
            <div className="mb-5">
              <label className="mb-2 block text-xs font-medium text-slate-400">Select Exchange</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
                {(Object.keys(EXCHANGES) as ExchangeId[]).map((id) => {
                  const ex = EXCHANGES[id];
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedExchange(id)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-all',
                        selectedExchange === id
                          ? 'border-brand-500/60 bg-brand-500/15 text-white'
                          : 'border-white/5 bg-white/3 text-slate-400 hover:border-white/10 hover:text-white'
                      )}
                    >
                      <span className="text-lg">{ex.logo}</span>
                      <span className="truncate">{ex.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left: Form */}
              <AddExchangeForm
                exchangeId={selectedExchange}
                hasPassphrase={exchangeMeta.hasPassphrase}
                onSubmit={(data) => addMutation.mutate({ ...data, exchangeId: selectedExchange })}
                isLoading={addMutation.isPending}
                onCancel={() => setShowAdd(false)}
              />

              {/* Right: Step-by-step guide */}
              <div className="rounded-xl border border-white/5 bg-white/3 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl">{exchangeMeta.logo}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">How to get your {exchangeMeta.name} API key</p>
                    <a
                      href={exchangeMeta.apiDocsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300"
                    >
                      Open {exchangeMeta.name} API Settings <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <ol className="space-y-2">
                  {exchangeMeta.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-400">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>

                {/* Required permissions */}
                <div className="mt-3 rounded-lg bg-white/3 p-3">
                  <p className="mb-1.5 text-xs font-medium text-slate-400">Required permissions</p>
                  <div className="flex flex-wrap gap-1">
                    {exchangeMeta.permissions.map((p) => (
                      <span key={p} className="badge-info text-xs">{p}</span>
                    ))}
                  </div>
                </div>

                {/* Warning */}
                {exchangeMeta.warning && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-yellow-400 mt-0.5" />
                    <p className="text-xs text-yellow-300">{exchangeMeta.warning}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connected Exchanges */}
      <div className="glass-card">
        <div className="border-b border-white/5 px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Connected Exchanges</h2>
            <span className="badge-info">{connections.length} connected</span>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/3" />
            ))}
          </div>
        ) : connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Wallet className="mb-3 h-10 w-10 text-slate-700" />
            <p className="text-sm font-medium text-slate-400">No exchanges connected yet</p>
            <p className="mt-1 text-xs text-slate-600">
              Add your first exchange to start trading
            </p>
            <button onClick={() => setShowAdd(true)} className="btn-primary mt-4 gap-2 text-sm">
              <Plus className="h-4 w-4" /> Connect Exchange
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {connections.map((conn) => (
              <ExchangeCard
                key={conn.id}
                connection={conn}
                onDelete={() => deleteMutation.mutate(conn.id)}
                onTest={() => testMutation.mutate(conn.id)}
                isTesting={testMutation.isPending}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Security Tips */}
      <SecurityTipsPanel />
    </div>
  );
}

// ─── Add Exchange Form ────────────────────────────────────────────────────────

function AddExchangeForm({ exchangeId, hasPassphrase, onSubmit, isLoading, onCancel }: {
  exchangeId: ExchangeId;
  hasPassphrase: boolean;
  onSubmit: (data: AddFormData) => void;
  isLoading: boolean;
  onCancel: () => void;
}) {
  const [showSecret, setShowSecret] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddFormData>({
    resolver: zodResolver(addSchema),
  });

  const onFormSubmit = (data: AddFormData) => {
    onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Label */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          Label <span className="text-slate-600">(optional)</span>
        </label>
        <input
          {...register('label')}
          placeholder={`My ${EXCHANGES[exchangeId].name} Account`}
          className="input-field"
        />
      </div>

      {/* API Key */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          API Key <span className="text-rose-400">*</span>
        </label>
        <input
          {...register('apiKey')}
          placeholder="Paste your API key here"
          className="input-field font-mono text-xs"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {errors.apiKey && <p className="mt-1 text-xs text-rose-400">{errors.apiKey.message}</p>}
      </div>

      {/* API Secret */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          API Secret <span className="text-rose-400">*</span>
        </label>
        <div className="relative">
          <input
            {...register('apiSecret')}
            type={showSecret ? 'text' : 'password'}
            placeholder="Paste your API secret here"
            className="input-field pr-10 font-mono text-xs"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.apiSecret && <p className="mt-1 text-xs text-rose-400">{errors.apiSecret.message}</p>}
      </div>

      {/* Passphrase (OKX, KuCoin, Bitget, Coinbase) */}
      {hasPassphrase && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">
            Passphrase <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <input
              {...register('passphrase')}
              type={showPassphrase ? 'text' : 'password'}
              placeholder="Your API passphrase"
              className="input-field pr-10"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowPassphrase(!showPassphrase)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Encryption notice */}
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5">
        <Shield className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
        <p className="text-xs text-emerald-300">
          Your keys are encrypted with AES-256 before being stored. We can never read them.
        </p>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={isLoading} className="btn-primary flex-1 gap-2 text-sm disabled:opacity-60">
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Verifying connection...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Connect & Verify
            </>
          )}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary text-sm px-4">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Exchange Card ────────────────────────────────────────────────────────────

function ExchangeCard({ connection, onDelete, onTest, isTesting, isDeleting }: {
  connection: ExchangeConnection;
  onDelete: () => void;
  onTest: () => void;
  isTesting: boolean;
  isDeleting: boolean;
}) {
  const [showBalances, setShowBalances] = useState(false);
  const meta = EXCHANGES[connection.exchangeId] ?? { name: connection.exchangeId, logo: '🔷', color: 'from-slate-500/20' };

  const { data: balances, isLoading: loadingBalances, refetch } = useQuery<Record<string, {
    free: number; locked: number; total: number;
  }>>({
    queryKey: ['balances', connection.id],
    queryFn: () => api.get(`/exchange/connections/${connection.id}/balances`).then((r) => r.data),
    enabled: showBalances,
  });

  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-4">
        {/* Exchange icon */}
        <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xl', meta.color)}>
          {meta.logo}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-white">{connection.label}</p>
            {connection.isVerified ? (
              <span className="badge-success flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            ) : (
              <span className="badge-warning flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Unverified
              </span>
            )}
            {connection.isActive && (
              <span className="badge-info">Active</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {meta.name} ·{' '}
            {connection.lastVerifiedAt
              ? `Last verified ${new Date(connection.lastVerifiedAt).toLocaleDateString()}`
              : 'Not yet verified'}
            {' · '}API Key: ••••••••
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => { setShowBalances(!showBalances); if (!showBalances) refetch(); }}
            className="btn-secondary gap-1.5 px-3 py-2 text-xs"
          >
            <Wallet className="h-3.5 w-3.5" />
            Balances
            {showBalances ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          <button
            onClick={onTest}
            disabled={isTesting}
            className="btn-secondary gap-1.5 px-3 py-2 text-xs"
            title="Test connection"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isTesting && 'animate-spin')} />
            {isTesting ? 'Testing...' : 'Test'}
          </button>

          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
            title="Remove exchange"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Balances expansion */}
      <AnimatePresence>
        {showBalances && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-xl border border-white/5 bg-white/3 p-4">
              <p className="mb-3 text-xs font-medium text-slate-400">Account Balances</p>
              {loadingBalances ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading balances...
                </div>
              ) : !balances || Object.keys(balances).length === 0 ? (
                <p className="text-xs text-slate-500">No balances found. Check your API permissions.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {Object.entries(balances).map(([asset, bal]) => (
                    <div key={asset} className="rounded-lg bg-white/3 p-2.5">
                      <p className="text-xs font-bold text-white">{asset}</p>
                      <p className="mt-0.5 font-mono text-sm font-semibold text-emerald-400">
                        {bal.total.toFixed(asset === 'USDT' || asset === 'USDC' ? 2 : 6)}
                      </p>
                      {bal.locked > 0 && (
                        <p className="text-xs text-slate-500">Locked: {bal.locked.toFixed(4)}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Security Tips ────────────────────────────────────────────────────────────

function SecurityTipsPanel() {
  const tips = [
    { icon: '🔒', title: 'Disable Withdrawals', desc: 'Never enable withdrawal permissions on trading API keys. Read + Trade is all you need.' },
    { icon: '📍', title: 'IP Restriction', desc: 'Whitelist only your server IP on the exchange API settings. This blocks unauthorized use even if keys leak.' },
    { icon: '🔄', title: 'Rotate Keys Regularly', desc: 'Create new API keys every 90 days and delete old ones. Takes 2 minutes and greatly improves security.' },
    { icon: '📊', title: 'Start with Paper Trading', desc: 'Always test your bot configuration in Paper Trading mode before switching to live trading.' },
  ];

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Info className="h-4 w-4 text-brand-400" />
        <h2 className="text-sm font-semibold text-white">API Security Best Practices</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tips.map((tip) => (
          <div key={tip.title} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/3 p-3">
            <span className="text-lg">{tip.icon}</span>
            <div>
              <p className="text-xs font-semibold text-white">{tip.title}</p>
              <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
