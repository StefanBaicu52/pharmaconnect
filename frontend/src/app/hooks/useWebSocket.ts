import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { API_BASE } from '../api';

interface UseWebSocketOptions {
  onBatch: (items: unknown[]) => void;
  onStatusChange?: (connected: boolean) => void;
}

export function useWebSocket({ onBatch, onStatusChange }: UseWebSocketOptions) {
  const clientRef = useRef<Client | null>(null);

  // Keep latest callbacks in refs so the WS closure always calls the current version
  const onBatchRef = useRef(onBatch);
  const onStatusRef = useRef(onStatusChange);

  useEffect(() => { onBatchRef.current = onBatch; }, [onBatch]);
  useEffect(() => { onStatusRef.current = onStatusChange; }, [onStatusChange]);

  const connect = useCallback(() => {
    if (clientRef.current?.connected) return;

    const wsUrl = API_BASE.replace(/^http/, 'ws') + '/ws';

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('WS connected');
        onStatusRef.current?.(true);
        client.subscribe('/topic/prescriptions', (message) => {
          try {
            console.log('WS message raw:', message.body);
            const batch = JSON.parse(message.body);
            console.log('WS batch parsed:', batch);
            onBatchRef.current(batch);
          } catch (e) {
            console.error('WS parse error', e, message.body);
          }
        });
      },
      onDisconnect: () => {
        console.log('WS disconnected');
        onStatusRef.current?.(false);
      },
      onStompError: (frame) => {
        console.error('WS STOMP error', frame);
        onStatusRef.current?.(false);
      },
    });

    client.activate();
    clientRef.current = client;
  }, []); // stable — uses refs internally

  const disconnect = useCallback(() => {
    clientRef.current?.deactivate();
    clientRef.current = null;
    onStatusRef.current?.(false);
  }, []);

  useEffect(() => {
    return () => { clientRef.current?.deactivate(); };
  }, []);

  return { connect, disconnect };
}