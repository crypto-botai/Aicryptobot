'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Brain, Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIValidationResult } from '@/types';

const schema = z.object({
  side: z.enum(['buy', 'sell']),
  type: z.enum(['market', 'limit', 'stop_market', 'stop_limit']),
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().positive().optional(),
  stopLoss: z.number().positive().optional(),
  takeProfit: z.number().positive().optional(),
  leverage: z.number().min(1).max(125).optional(),
  useAiValidation: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

interface Props {
  symbol: string;
  onValidate: (data: Record<string, unknown>) => void;
  onSubmit: (data: Record<string, unknown>) => void;
  validationResult: AIValidationResult | null;
  isValidating: boolean;
  isSubmitting: boolean;
}

export function OrderForm({ symbol, onValidate, onSubmit, validationResult, isValidating, isSubmitting }: Props) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { side: 'buy', type: 'market', useAiValidation: true },
  });

  const orderType = watch('type');
  const useAI = watch('useAiValidation');

  const handleFormSubmit = (data: FormData) => {
    const payload = { ...data, symbol, side };
    if (useAI && !validationResult) {
      onValidate(payload);
    } else {
      onSubmit(payload);
    }
  };

  const confidence = validationResult?.overallConfidence ?? 0;
  const approved = validationResult?.approved ?? false;

  return (
    <div className="flex h-full flex-col">
      <h3 className="mb-4 text-sm font-semibold text-white">Place Order</h3>

      {/* Buy/Sell toggle */}
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-white/5 bg-white/3 p-1">
        <button
          type="button"
          onClick={() => setSide('buy')}
          className={cn('rounded-lg py-2 text-sm font-semibold transition-all', side === 'buy'
            ? 'bg-emerald-500 text-white shadow-glow-green'
            : 'text-slate-400 hover:text-white'
          )}
        >
          Buy / Long
        </button>
        <button
          type="button"
          onClick={() => setSide('sell')}
          className={cn('rounded-lg py-2 text-sm font-semibold transition-all', side === 'sell'
            ? 'bg-rose-500 text-white shadow-glow-red'
            : 'text-slate-400 hover:text-white'
          )}
        >
          Sell / Short
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 flex flex-col gap-3">
        {/* Order Type */}
        <div>
          <label className="mb-1 block text-xs text-slate-400">Order Type</label>
          <select {...register('type')} className="input-field py-2">
            <option value="market">Market</option>
            <option value="limit">Limit</option>
            <option value="stop_market">Stop Market</option>
            <option value="stop_limit">Stop Limit</option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="mb-1 block text-xs text-slate-400">Quantity</label>
          <input
            {...register('quantity', { valueAsNumber: true })}
            type="number"
            step="any"
            placeholder="0.001"
            className="input-field"
          />
          {errors.quantity && <p className="mt-0.5 text-xs text-rose-400">{errors.quantity.message}</p>}
        </div>

        {/* Price (limit orders) */}
        {(orderType === 'limit' || orderType === 'stop_limit') && (
          <div>
            <label className="mb-1 block text-xs text-slate-400">Price</label>
            <input
              {...register('price', { valueAsNumber: true })}
              type="number"
              step="any"
              placeholder="0.00"
              className="input-field"
            />
          </div>
        )}

        {/* Stop Loss & Take Profit */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Stop Loss</label>
            <input
              {...register('stopLoss', { valueAsNumber: true })}
              type="number"
              step="any"
              placeholder="Optional"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Take Profit</label>
            <input
              {...register('takeProfit', { valueAsNumber: true })}
              type="number"
              step="any"
              placeholder="Optional"
              className="input-field"
            />
          </div>
        </div>

        {/* AI Validation toggle */}
        <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/3 px-3 py-2">
          <Brain className="h-4 w-4 text-purple-400" />
          <span className="flex-1 text-xs text-slate-300">AI Pre-validation</span>
          <input {...register('useAiValidation')} type="checkbox" className="h-4 w-4 rounded" defaultChecked />
        </div>

        {/* Validation Result */}
        <AnimatePresence>
          {validationResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={cn('rounded-xl border p-3 text-xs', approved
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : 'border-rose-500/30 bg-rose-500/10'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {approved
                  ? <CheckCircle className="h-4 w-4 text-emerald-400" />
                  : <XCircle className="h-4 w-4 text-rose-400" />
                }
                <span className={cn('font-semibold', approved ? 'text-emerald-300' : 'text-rose-300')}>
                  {approved ? 'AI Approved' : 'AI Rejected'} · {Math.round(confidence * 100)}% confidence
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">{validationResult.reasoning}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-auto">
          <button
            type="submit"
            disabled={isValidating || isSubmitting}
            className={cn(
              'w-full py-3 text-sm font-semibold disabled:opacity-60',
              validationResult
                ? (approved ? 'btn-success' : 'btn-danger')
                : (side === 'buy' ? 'btn-success' : 'btn-danger')
            )}
          >
            {isValidating ? (
              <span className="flex items-center justify-center gap-2">
                <Brain className="h-4 w-4 animate-pulse" />
                AI Validating...
              </span>
            ) : isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Placing Order...
              </span>
            ) : validationResult ? (
              approved ? `Confirm ${side.toUpperCase()} Order` : 'Override & Place Anyway'
            ) : (
              `${useAI ? 'Validate & ' : ''}${side === 'buy' ? 'Buy' : 'Sell'} ${symbol}`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
