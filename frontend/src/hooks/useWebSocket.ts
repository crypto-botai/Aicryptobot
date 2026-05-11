import { useEffect, useState, useCallback } from 'react';
import { wsClient } from '@/lib/websocket/client';
import { useTickerStore } from '@/store/tickers';
import { useAlertStore } from '@/store/alerts';
import type { Ticker, Alert, WSEventType } from '@/types';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(wsClient.isConnected());
  const { setTicker } = useTickerStore();
  const { addAlert } = useAlertStore();

  useEffect(() => {
    const checkInterval = setInterval(() => {
      setIsConnected(wsClient.isConnected());
    }, 2000);

    const unsubTicker = wsClient.subscribe('ticker.update' as WSEventType, (data) => {
      setTicker(data as Ticker);
    });
    const unsubAlert = wsClient.subscribe('alert.new' as WSEventType, (data) => {
      addAlert(data as Alert);
    });

    return () => {
      clearInterval(checkInterval);
      unsubTicker();
      unsubAlert();
    };
  }, [setTicker, addAlert]);

  const subscribe = useCallback((event: WSEventType, handler: (data: unknown) => void) => {
    return wsClient.subscribe(event, handler);
  }, []);

  return { isConnected, subscribe };
}
