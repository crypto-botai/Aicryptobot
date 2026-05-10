'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createChart, ColorType, CrosshairMode, type IChartApi } from 'lightweight-charts';
import { api } from '@/lib/api/client';

interface EquityPoint {
  time: number;
  value: number;
}

export function PortfolioChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<IChartApi | null>(null);

  const { data: equityData } = useQuery<EquityPoint[]>({
    queryKey: ['equity-curve', '30d'],
    queryFn: () => api.get('/analytics/equity-curve?period=30d').then((r) => r.data),
  });

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 240,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.05)',
        textColor: '#94a3b8',
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.05)',
        textColor: '#94a3b8',
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
    });

    const areaSeries = chart.addAreaSeries({
      topColor: 'rgba(99,102,241,0.4)',
      bottomColor: 'rgba(99,102,241,0.02)',
      lineColor: '#6366f1',
      lineWidth: 2,
      crosshairMarkerRadius: 5,
      crosshairMarkerBackgroundColor: '#6366f1',
    });

    if (equityData && equityData.length > 0) {
      areaSeries.setData(
        equityData.map((p) => ({ time: p.time as unknown as string, value: p.value }))
      );
      chart.timeScale().fitContent();
    }

    chartInstance.current = chart;

    const handleResize = () => {
      if (chartRef.current) chart.applyOptions({ width: chartRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [equityData]);

  return (
    <div ref={chartRef} className="w-full" style={{ minHeight: 240 }}>
      {!equityData && (
        <div className="flex h-60 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
