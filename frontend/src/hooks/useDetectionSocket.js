import { useEffect, useRef, useState } from "react";

const WS_URL = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`; // qua proxy Vite, kèm cookie đăng nhập

export function useDetectionSocket() {
  const [connected, setConnected] = useState(false);
  const [payload, setPayload] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        if (!cancelled) setTimeout(connect, 1000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (event) => setPayload(JSON.parse(event.data));
    }

    connect();
    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, []);

  return { connected, payload };
}
