import { useCallback, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { StreamMessage } from '../types';

interface UseWebSocketReturn {
  connect: (sessionId: string, onMessage: (msg: StreamMessage) => void) => void;
  disconnect: () => void;
  isConnected: boolean;
}

/**
 * useWebSocket - Custom React hook for STOMP/WebSocket connection.
 * 
 * How it works:
 *  1. Creates a SockJS connection to the backend
 *  2. STOMP protocol is layered on top of WebSocket
 *  3. Subscribes to a session-specific topic
 *  4. Calls onMessage callback whenever a message arrives
 * 
 * STOMP (Simple Text Oriented Messaging Protocol):
 *  - A messaging protocol that works over WebSocket
 *  - Supports publish/subscribe patterns
 *  - Spring's @EnableWebSocketMessageBroker speaks STOMP natively
 */
export function useWebSocket(): UseWebSocketReturn {
  const clientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback((sessionId: string, onMessage: (msg: StreamMessage) => void) => {
    // Disconnect any existing connection
    if (clientRef.current?.active) {
      clientRef.current.deactivate();
    }

    // Create new STOMP client
    const client = new Client({
      // SockJS provides the WebSocket transport with fallbacks
      webSocketFactory: () => new SockJS('/ws'),

      onConnect: () => {
        console.log('WebSocket connected, subscribing to session:', sessionId);
        setIsConnected(true);

        // Subscribe to this debate session's topic
        // The backend sends messages to /topic/debate/{sessionId}
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

      reconnectDelay: 5000, // Auto-reconnect after 5 seconds if connection drops
    });

    clientRef.current = client;
    client.activate(); // Start the connection
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.deactivate();
    setIsConnected(false);
  }, []);

  return { connect, disconnect, isConnected };
}
