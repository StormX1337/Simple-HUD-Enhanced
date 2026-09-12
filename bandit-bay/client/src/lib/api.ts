import type {
  AttackResult,
  ChestOffer,
  ChestResponse,
  ClaimResponse,
  DailyState,
  GameConfig,
  HistoryEntry,
  LeaderboardEntry,
  PetState,
  PlayerState,
  QuestState,
  RaidResult,
  SetProgress,
  SpinResult,
  TargetInfo,
  UpgradeResponse,
} from '../types';

const TOKEN_KEY = 'bandit-bay.token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : {};
  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'error' in data
        ? String((data as { error: unknown }).error)
        : `Fehler ${response.status}`;
    throw new ApiError(message, response.status);
  }
  return data as T;
}

const post = <T>(path: string, body?: unknown): Promise<T> =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });

export const api = {
  config: () => request<GameConfig>('/config'),
  register: (name: string, avatar: string) =>
    post<{ token: string; state: PlayerState }>('/auth/register', { name, avatar }),
  me: () => request<{ state: PlayerState }>('/auth/me'),
  state: () =>
    request<{ state: PlayerState; quests: QuestState[]; daily: DailyState }>('/state'),
  spin: (bet: number) => post<SpinResult>('/spin', { bet }),
  setBet: (bet: number) => post<{ state: PlayerState }>('/bet', { bet }),
  upgrade: (index: number) => post<UpgradeResponse>('/village/upgrade', { index }),
  targets: () => request<{ targets: TargetInfo[] }>('/targets'),
  attack: (targetId: string, spotIndex: number) =>
    post<AttackResult>('/attack', { targetId, spotIndex }),
  raid: (targetId: string, spotIndex: number) => post<RaidResult>('/raid', { targetId, spotIndex }),
  collection: () =>
    request<{ state: PlayerState; chests: ChestOffer[]; sets: SetProgress[] }>('/collection'),
  openChest: (chestId: string) => post<ChestResponse>('/collection/chest', { chestId }),
  claimSet: (setId: string) => post<ClaimResponse>('/collection/set', { setId }),
  quests: () => request<{ quests: QuestState[] }>('/quests'),
  claimQuest: (questId: string) => post<ClaimResponse>('/quests/claim', { questId }),
  daily: () => request<{ daily: DailyState }>('/daily'),
  claimDaily: () => post<ClaimResponse>('/daily/claim'),
  pets: () => request<{ pets: PetState[]; state: PlayerState }>('/pets'),
  feedPet: (petId: string) =>
    post<{ petId: string; cost: number; secondsLeft: number; pets: PetState[]; state: PlayerState }>(
      '/pets/feed',
      { petId },
    ),
  leaderboard: () => request<{ entries: LeaderboardEntry[] }>('/leaderboard'),
  history: () => request<{ entries: HistoryEntry[] }>('/history'),
};
