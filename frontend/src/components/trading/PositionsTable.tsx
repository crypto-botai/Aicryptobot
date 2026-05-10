'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api/client';
import { cn, formatPrice, formatPercent } from '@/lib/utils';
import type { Position } from '@/types';

interface Props {
  positions: Position[];
}

export function PositionsTable({ positions }: Props) {
  const qc = useQueryClient();
  const closePosition = useMutation({
    mutationFn: (positionId: string) =>
      api.post(`/trading/positions/${positionId}/close`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Position closed');
      qc.invalidateQueries({ queryKey: ['positions'] });
    },
    onError: () => toast.error('Failed to close position'),
  });

  if (!positions.length) {
    return <p className="py-4 text-center text-sm text-slate-500">No open positions</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Side</th>
            <th>Size</th>
            <th>Entry</th>
            <th>Mark</th>
            <th>PnL</th>
            <th>Liq. Price</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => (
            <tr key={pos.id}>
              <td className="font-mono font-medium text-white">{pos.symbol}</td>
              <td>
                <span className={pos.side === 'long' ? 'badge-success' : 'badge-danger'}>
                  {pos.side.toUpperCase()}
                </span>
              </td>
              <td className="font-mono">{pos.size.toFixed(4)}</td>
              <td className="font-mono">{formatPrice(pos.entryPrice)}</td>
              <td className="font-mono">{formatPrice(pos.markPrice)}</td>
              <td>
                <span className={cn('font-mono font-semibold', pos.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                  {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)} ({formatPercent(pos.pnlPercent)})
                </span>
              </td>
              <td className="font-mono text-yellow-400">{pos.liquidationPrice ? formatPrice(pos.liquidationPrice) : '—'}</td>
              <td>
                <button
                  onClick={() => closePosition.mutate(pos.id)}
                  disabled={closePosition.isPending}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 transition-colors hover:bg-rose-500/40 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
