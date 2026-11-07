import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

export interface LiveAlert {
  id: string;
  type: 'emergency' | 'call' | 'booking';
  title: string;
  message: string;
  callerName?: string;
  phone?: string;
  leadScore?: number | null;
  serviceType?: string;
  rawCall?: any;
}

interface WebSocketContextType {
  isConnected: boolean;
  activeAlert: LiveAlert | null;
  dismissAlert: () => void;
  lastEvent: { type: string; data: any } | null;
  subscribe: (callback: (event: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [activeAlert, setActiveAlert] = useState<LiveAlert | null>(null);
  const [lastEvent, setLastEvent] = useState<{ type: string; data: any } | null>(null);
  
  const listenersRef = useRef<Set<(event: any) => void>>(new Set());
  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const subscribe = useCallback((callback: (event: any) => void) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);

  const dismissAlert = () => {
    setActiveAlert(null);
  };

  const connect = useCallback(() => {
    // Avoid double connect
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = 'ws://localhost:8000/ws';
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Start ping heartbeat
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping');
        }
      }, 20000);
    };

    ws.onmessage = (event) => {
      if (event.data === 'pong') return;
      try {
        const payload = JSON.parse(event.data);
        setLastEvent(payload);

        // Notify subscribers
        listenersRef.current.forEach(listener => {
          try {
            listener(payload);
          } catch (e) {
            console.error('Error in WS subscriber:', e);
          }
        });

        // Handle Alert Toasts
        if (payload.type === 'NEW_CALL') {
          const call = payload.data.call;
          const isEmergency = payload.data.isEmergency || call.urgency === 'emergency';
          
          setActiveAlert({
            id: call.id || String(Date.now()),
            type: isEmergency ? 'emergency' : 'call',
            title: isEmergency ? '🚨 Active Emergency Call Received!' : '📞 Inbound Call Processed',
            message: call.summary || `Call from ${call.callerName} regarding ${call.serviceType}`,
            callerName: call.callerName,
            phone: call.callerPhone,
            leadScore: call.leadScore,
            serviceType: call.serviceType,
            rawCall: call,
          });
        } else if (payload.type === 'NEW_BOOKING') {
          const booking = payload.data;
          setActiveAlert({
            id: booking.id || String(Date.now()),
            type: 'booking',
            title: '📅 New Appointment Booked',
            message: `${booking.customerName} booked ${booking.serviceType} for ${booking.date} at ${booking.time}`,
            callerName: booking.customerName,
            serviceType: booking.serviceType,
          });
        }
      } catch (err) {
        console.warn('WS message parse error:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      clearInterval(pingIntervalRef.current);
      // Schedule auto-reconnect
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      clearInterval(pingIntervalRef.current);
      clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  // Auto-dismiss alert after 9 seconds if not an emergency
  useEffect(() => {
    if (!activeAlert) return;
    if (activeAlert.type === 'emergency') return; // Keep emergency until dismissed
    const timer = setTimeout(() => {
      setActiveAlert(null);
    }, 9000);
    return () => clearTimeout(timer);
  }, [activeAlert]);

  return (
    <WebSocketContext.Provider value={{ isConnected, activeAlert, dismissAlert, lastEvent, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

