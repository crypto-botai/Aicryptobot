'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api/client';
import { cn, formatPrice, formatUSD } from '@/lib/utils';
import type { Order } from '@/types';

export function RecentTradesTable() {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['orders', 'recent'],
    queryFn: () => api.get('/trading/orders?limit=10&status=filled').then((r) => r.data),
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex animate-pulse items-center gap-3 py-2">
            <div className="h-2.5 w-16 rounded bg-white/5" />
            <div className="h-2.5 flex-1 rounded bg-white/5" />
            <div className="h-2.5 w-20 rounded bg-white/5" />
          </div>
        ))}
      </div>
    );
  }

  if (!orders?.length) {
    return <p className="py-4 text-center text-sm text-slate-500">No recent trades</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Side</th>
            <th>Price</th>
            <th>Amount</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, i) => (
            <motion.tr
              key={order.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <td className="font-mono font-medium text-white">{order.symbol}</td>
              <td>
                <span className={cn('badge-', order.side === 'buy' ? 'success' : 'danger',
                  order.side === 'buy' ? 'badge-success' : 'badge-danger'
                )}>
                  {order.side.toUpperCase()}
                </span>
              </td>
              <td className="font-mono">{formatPrice(order.avgFillPrice ?? order.price)}</td>
              <td className="font-mono">{order.filledQuantity.toFixed(4)}</td>
              <td className="text-slate-500">
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
