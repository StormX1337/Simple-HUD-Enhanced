import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, api, clearToken, getToken, setToken } from '../lib/api';
import { preloadSounds, playSound } from '../lib/sound';
import type { DailyState, GameConfig, PlayerState, QuestState } from '../types';

export interface Toast {
  id: number;
  text: string;
  kind: 'info' | 'good' | 'bad';
}

interface GameContextValue {
  config: GameConfig | null;
  state: PlayerState | null;
  quests: QuestState[];
  daily: DailyState | null;
  booting: boolean;
  toasts: Toast[];
  secondsToNextSpin: number;
  pushToast: (text: string, kind?: Toast['kind']) => void;
  register: (name: string, avatar: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  applyState: (next: PlayerState) => void;
  setQuests: (quests: QuestState[]) => void;
  setDaily: (daily: DailyState) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }): JSX.Element {
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [state, setState] = useState<PlayerState | null>(null);
  const [quests, setQuests] = useState<QuestState[]>([]);
  const [daily, setDaily] = useState<DailyState | null>(null);
  const [booting, setBooting] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [secondsToNextSpin, setSecondsToNextSpin] = useState(0);
  const toastId = useRef(1);

  const pushToast = useCallback((text: string, kind: Toast['kind'] = 'info') => {
    const id = toastId.current++;
    setToasts((current) => [...current, { id, text, kind }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2800);
  }, []);

  const applyState = useCallback((next: PlayerState) => {
    setState(next);
    setSecondsToNextSpin(next.nextSpinInSeconds);
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) return;
    try {
      const data = await api.state();
      applyState(data.state);
      setQuests(data.quests);
      setDaily(data.daily);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearToken();
        setState(null);
      }
    }
  }, [applyState]);

  // Erststart: Inhalte laden und – falls vorhanden – Sitzung wiederherstellen.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loadedConfig = await api.config();
        if (!cancelled) setConfig(loadedConfig);
        if (getToken()) await refresh();
      } catch {
        if (!cancelled) pushToast('Server nicht erreichbar', 'bad');
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    preloadSounds();
    return () => {
      cancelled = true;
    };
  }, [refresh, pushToast]);

  // Spin-Regeneration herunterzaehlen und bei 0 neu laden.
  useEffect(() => {
    if (!state) return undefined;
    const timer = window.setInterval(() => {
      setSecondsToNextSpin((current) => {
        if (current <= 1) {
          void refresh();
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state, refresh]);

  // Beim Zurueckkehren in den Tab aktuellen Stand holen.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  const register = useCallback(
    async (name: string, avatar: string) => {
      const data = await api.register(name, avatar);
      setToken(data.token);
      applyState(data.state);
      playSound('reward');
      await refresh();
    },
    [applyState, refresh],
  );

  const logout = useCallback(() => {
    clearToken();
    setState(null);
    setQuests([]);
    setDaily(null);
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      config,
      state,
      quests,
      daily,
      booting,
      toasts,
      secondsToNextSpin,
      pushToast,
      register,
      logout,
      refresh,
      applyState,
      setQuests,
      setDaily,
    }),
    [
      config,
      state,
      quests,
      daily,
      booting,
      toasts,
      secondsToNextSpin,
      pushToast,
      register,
      logout,
      refresh,
      applyState,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame muss innerhalb von GameProvider benutzt werden');
  return context;
}
