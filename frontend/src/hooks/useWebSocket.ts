import { useCallback, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { StreamMessage } from '../types';

interface UseWebSocketReturn {
  connect: (sessionId: string, onMessage: (msg: StreamMessage) => void) => void;
  disconnect: () => void;
  isConnected: boolean;
}

export function useWebSocket(): UseWebSocketReturn {
  const clientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(
    (sessionId: string, onMessage: (msg: StreamMessage) => void) => {
      if (clientRef.current?.active) {
        clientRef.current.deactivate();
      }

      // 🔥 Use same backend base URL as REST API
      const WS_BASE =
        import.meta.env.VITE_API_BASE_URL ||
        'https://stock-arena.onrender.com';

      const wsUrl = `${WS_BASE}/ws`;

      console.info(`[WebSocket] Connecting to: ${wsUrl}`);

      const client = new Client({
        webSocketFactory: () => new SockJS(wsUrl),

        onConnect: () => {
          console.log('WebSocket connected. Subscribing to session:', sessionId);
          setIsConnected(true);

          client.subscribe(`/topic/debate/${sessionId}`, (stompMessage) => {
            try {
              const parsed: StreamMessage = JSON.parse(stompMessage.body);
              onMessage(parsed);
            } catch (err) {
              console.error('Failed to parse WebSocket message:', err);
            }
          });
        },

        onDisconnect: () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
        },

        onStompError: (frame) => {
          console.error('STOMP error:', frame);
          setIsConnected(false);
        },

        reconnectDelay: 5000,
      });

      clientRef.current = client;
      client.activate();
    },
    []
  );

  const disconnect = useCallback(() => {
    clientRef.current?.deactivate();
    setIsConnected(false);
  }, []);

  return { connect, disconnect, isConnected };
}
