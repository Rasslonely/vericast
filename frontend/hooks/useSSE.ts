import { useState, useEffect, useRef } from 'react';

export interface LogEntry {
  id: number;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  source: string;
  message: string;
  timestamp: string;
}

export interface GameState {
  players: { id: string; x: number; y: number; health: number }[];
  tick: number;
  result: {
    state_root: string;
    da_root: string;
    tee_seal: string | null;
    explorer_link: string | null;
  };
}

export interface SocialState {
  result: {
    feed_id: string;
    flagged_agents: string[];
    tee_seal: string | null;
    summary: string;
  };
}

export interface DepinState {
  result: {
    key: string;
    da_root: string;
    tee_seal: string | null;
    explorer_link: string | null;
  };
}

export function useSSE(api: string) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [socialState, setSocialState] = useState<SocialState | null>(null);
  const [depinState, setDepinState] = useState<DepinState | null>(null);
  const [connected, setConnected] = useState(false);

  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const backoff = useRef(1000);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connect = () => {
      if (!api) return;
      eventSource = new EventSource(`${api}/stream`);

      eventSource.onopen = () => {
        setConnected(true);
        backoff.current = 1000;
      };

      eventSource.addEventListener('log', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          const newLog: LogEntry = {
            id: Date.now() + Math.random(),
            level: data.level,
            source: data.source,
            message: data.message,
            timestamp: new Date().toLocaleTimeString([], { hour12: false })
          };
          setLogs(prev => [...prev.slice(-149), newLog]);
        } catch (err) {}
      });

      eventSource.addEventListener('game_update', (e: MessageEvent) => {
        try {
          setGameState(JSON.parse(e.data));
        } catch (err) {}
      });

      eventSource.addEventListener('social_update', (e: MessageEvent) => {
        try {
          setSocialState(JSON.parse(e.data));
        } catch (err) {}
      });

      eventSource.addEventListener('depin_update', (e: MessageEvent) => {
        try {
          setDepinState(JSON.parse(e.data));
        } catch (err) {}
      });

      eventSource.onerror = () => {
        setConnected(false);
        if (eventSource) {
          eventSource.close();
        }
        const wait = Math.min(backoff.current, 15000);
        reconnectTimeout.current = setTimeout(connect, wait);
        backoff.current *= 2;
      };
    };

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [api]);

  return { logs, gameState, socialState, depinState, connected };
}
