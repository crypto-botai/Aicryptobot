import { create } from 'zustand';
import type { Ticker } from '@/types';

interface TickerStore {
  tickers: Record<string, Ticker>;
  setTicker: (ticker: Ticker) => void;
  setTickers: (tickers: Ticker[]) => void;
}

export const useTickerStore = create<TickerStore>((set) => ({
  tickers: {},
  setTicker: (ticker) => set((s) => ({ tickers: { ...s.tickers, [ticker.symbol]: ticker } })),
  setTickers: (list) => set(() => ({
    tickers: Object.fromEntries(list.map((t) => [t.symbol, t])),
  })),
}));
