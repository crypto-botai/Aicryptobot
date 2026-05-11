'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, TrendingUp, TrendingDown, AlertCircle, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api/client';
import { cn, formatPrice, formatUSD } from '@/lib/utils';
import type { Order, Position, AIValidationResult } from '@/types';
import { TradingChart } from '@/components/trading/TradingChart';
import { OrderForm } from '@/components/trading/OrderForm';
import { PositionsTable } from '@/components/trading/PositionsTable';

export default function TradingPage() {
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [showValidation, setShowValidation] = useState(false);
  const [validationResult, setValidationResult] = useState<AIValidationResult | null>(null);
  const qc = useQueryClient();

  const { data: positions } = useQuery<Position[]>({
    queryKey: ['positions'],
    queryFn: () => api.get('/trading/positions').then((r) => r.data),
    refetchInterval: 5_000,
  });

  const validateTrade = useMutation({
    mutationFn: (orderData: Record<string, unknown>) =>
      api.post<AIValidationResult>('/ai/validate-trade', orderData).then((r) => r.data),
    onSuccess: (data) => {
      setValidationResult(data);
      setShowValidation(true);
    },
    onError: () => toast.error('AI validation failed'),
  });

  const placeOrder = useMutation({
    mutationFn: (orderData: Record<string, unknown>) =>
      api.post('/trading/orders', orderData).then((r) => r.data),
    onSuccess: () => {
      toast.success('Order placed successfully');
      qc.invalidateQueries({ queryKey: ['positions'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      setShowValidation(false);
    },
    onError: (e: Error) => toast.error(e.message ?? 'Order failed'),
  });

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trading</h1>
          <p className="text-sm text-slate-400">AI-validated order execution</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="input-field w-40 py-2"
          >
            {['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-4">
        {/* Chart */}
        <div className="glass-card xl:col-span-3">
          <TradingChart symbol={symbol} />
        </div>

        {/* Order Form */}
        <div className="glass-card p-5">
          <OrderForm
            symbol={symbol}
            onValidate={(data) => validateTrade.mutate(data)}
            onSubmit={(data) => placeOrder.mutate(data)}
            validationResult={validationResult}
            isValidating={validateTrade.isPending}
            isSubmitting={placeOrder.isPending}
          />
        </div>
      </div>

      {/* Positions */}
      <div className="glass-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-base font-semibold text-white">Open Positions</h2>
          <span className="badge-info">{positions?.length ?? 0}</span>
        </div>
        <PositionsTable positions={positions ?? []} />
      </div>
    </div>
  );
}
