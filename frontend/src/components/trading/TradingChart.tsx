'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createChart, ColorType, CandlestickSeries, CrosshairMode } from 'lightweight-charts';
import { api } from '@/lib/api/client';
import type { Candle } from '@/types';

const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'];

interface Props {
  symbol: string;
}

export function TradingChart({ symbol }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [interval, setInterval] = useState('1h');

  const { data: candles } = useQuery<Candle[]>({
    queryKey: ['candles', symbol, interval],
    queryFn: () => api.get(`/market/candles?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=500`).then((r) => r.data),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!chartRef.current || !candles?.length) return;

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: chartRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.05)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.05)' },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderDownColor: '#f43f5e',
      borderUpColor: '#10b981',
      wickDownColor: '#f43f5e',
      wickUpColor: '#10b981',
    });

    candleSeries.setData(
      candles.map((c) => ({
        time: c.time as unknown as string,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartRef.current) {
        chart.applyOptions({
          width: chartRef.current.clientWidth,
          height: chartRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [candles]);

  return (
    <div className="flex h-full flex-col p-4">
      {/* Toolbar */}
      <div className="mb-3 flex items-center gap-2">
        <span className="font-mono text-sm font-bold text-white">{symbol}</span>
        <div className="ml-4 flex gap-1">
          {INTERVALS.map((iv) => (
            <button
              key={iv}
              onClick={() => setInterval(iv)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                interval === iv ? 'bg-brand-500/30 text-brand-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {iv}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div ref={chartRef} className="flex-1" style={{ minHeight: 350 }}>
        {!candles?.length && (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}
