'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTickerStore } from '@/store/tickers';
import { cn } from '@/lib/utils';
import { formatPrice, formatPercent } from '@/lib/utils';

const DEFAULT_SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'AVAX/USDT'];

export function TickerTape() {
  const { tickers } = useTickerStore();
  const items = DEFAULT_SYMBOLS.map((s) => ({ symbol: s, ...(tickers[s] ?? { price: 0, changePercent24h: 0 }) }));

  return (
    <div className="relative h-8 overflow-hidden border-b border-white/5 bg-dark-900/40">
      <div className="animate-ticker flex h-full items-center gap-8 whitespace-nowrap px-4" style={{ width: 'max-content' }}>
        {[...items, ...items].map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="font-mono font-semibold text-slate-300">{item.symbol}</span>
            <span className="font-mono text-white">{formatPrice(item.price)}</span>
            <span className={cn('font-mono', (item.changePercent24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {formatPercent(item.changePercent24h ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
