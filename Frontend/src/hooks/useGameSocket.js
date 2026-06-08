import { useState, useEffect, useRef, useCallback } from 'react';

export default function useGameSocket({ onMessage, onError, onConnect, onDisconnect } = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const callbacksRef = useRef({ onMessage, onError, onConnect, onDisconnect });

  // Keep callbacks fresh without re-triggering the socket connection
  useEffect(() => {
    callbacksRef.current = { onMessage, onError, onConnect, onDisconnect };
  }, [onMessage, onError, onConnect, onDisconnect]);

  useEffect(() => {
    let reconnectTimeout = null;

    const connectWS = () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const wsUrl = apiUrl.replace(/^http/, 'ws') + '/ws/game/';
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        
        ws.onopen = () => {
          console.log('[WS] Connected to game socket');
          if (ws.readyState === WebSocket.OPEN) {
            setIsConnected(true);
            if (callbacksRef.current.onConnect) callbacksRef.current.onConnect(ws);
          }
        };

        ws.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data);
            console.log('[WS] Received:', response.action || response.error);
            if (callbacksRef.current.onMessage) callbacksRef.current.onMessage(response);
          } catch (e) {
            console.warn('[WS] Error parsing message:', e);
          }
        };

        ws.onerror = (err) => {
          console.warn('[WS] Connection error:', err);
          setIsConnected(false);
          if (callbacksRef.current.onError) callbacksRef.current.onError(err);
        };

        ws.onclose = () => {
          console.log('[WS] Disconnected');
          setIsConnected(false);
          wsRef.current = null;
          if (callbacksRef.current.onDisconnect) callbacksRef.current.onDisconnect();
          // Auto-reconnect logic
          reconnectTimeout = setTimeout(connectWS, 3000);
        };
      } catch (err) {
        console.warn('[WS] Setup error:', err);
      }
    };

    connectWS();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const sendMessage = useCallback((msgObj) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msgObj));
      return true;
    } else {
      console.warn('[WS] Cannot send message, socket not open');
      return false;
    }
  }, []);

  return { isConnected, sendMessage, wsRef };
}
