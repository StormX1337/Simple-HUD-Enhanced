import type {
  AchievementState,
  AttackResult,
  CardDef,
  DecoState,
  EventState,
  EventWindowInfo,
  FriendInfo,
  VillageOverview,
  TournamentState,
  WheelResult,
  WheelStatus,
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

/** Server nicht erreichbar (kein HTTP-Fehler, sondern gar keine Antwort). */
export class OfflineError extends Error {
  constructor(message = 'Keine Verbindung zum Server') {
    super(message);
  }
}

/** Lesbare Fehlermeldung für Toasts. */
export function errorText(error: unknown, fallback: string): string {
  if (error instanceof OfflineError) return 'Keine Verbindung zum Server';
  if (error instanceof ApiError) return error.message;
  return fallback;
}

type ConnectionListener = (online: boolean) => void;
const connectionListeners = new Set<ConnectionListener>();

/** Meldet, ob der Server gerade antwortet. */
export function onConnectionChange(listener: ConnectionListener): () => void {
  connectionListeners.add(listener);
  return () => connectionListeners.delete(listener);
}

function reportConnection(online: boolean): void {
  for (const listener of connectionListeners) listener(online);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch {
    reportConnection(false);
    throw new OfflineError();
  }
  reportConnection(true);
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
  updateProfile: (name: string, avatar: string) =>
    post<{ state: PlayerState }>('/profile', { name, avatar }),
  state: () =>
    request<{
      state: PlayerState;
      quests: QuestState[];
      daily: DailyState;
      news: HistoryEntry[];
    }>('/state'),
  newsSeen: () => post<{ ok: boolean }>('/news/seen'),
  target: (id: string) => request<{ target: TargetInfo }>(`/target/${id}`),
  spin: (bet: number) => post<SpinResult>('/spin', { bet }),
  setBet: (bet: number) => post<{ state: PlayerState }>('/bet', { bet }),
  upgrade: (index: number) => post<UpgradeResponse>('/village/upgrade', { index }),
  targets: () => request<{ targets: TargetInfo[] }>('/targets'),
  decorations: () => request<{ decorations: DecoState }>('/decorations'),
  buyDecoration: (slot: number, decoId: string) =>
    post<{ slot: number; cost: number; decorations: DecoState; state: PlayerState }>(
      '/decorations/buy',
      { slot, decoId },
    ),
  removeDecoration: (slot: number) =>
    post<{ decorations: DecoState; state: PlayerState }>('/decorations/remove', { slot }),
  villages: () => request<{ current: number; villages: VillageOverview[] }>('/villages'),
  friends: () => request<{ friends: FriendInfo[] }>('/friends'),
  addFriend: (name: string) =>
    post<{ friend: FriendInfo; friends: FriendInfo[] }>('/friends/add', { name }),
  removeFriend: (friendId: string) =>
    post<{ friends: FriendInfo[] }>('/friends/remove', { friendId }),
  attack: (targetId: string, spotIndex: number) =>
    post<AttackResult>('/attack', { targetId, spotIndex }),
  raid: (targetId: string, spotIndex: number) => post<RaidResult>('/raid', { targetId, spotIndex }),
  prepareRaid: (targetId: string) =>
    post<{ targetId: string; revealedIndex: number | null; abilityName: string | null }>(
      '/raid/prepare',
      { targetId },
    ),
  collection: () =>
    request<{
      state: PlayerState;
      chests: ChestOffer[];
      sets: SetProgress[];
      gifts: { sentToday: number; limit: number; left: number };
    }>('/collection'),
  giftCard: (friendId: string, cardId: string) =>
    post<{
      card: CardDef;
      friendName: string;
      left: number;
      state: PlayerState;
      gifts: { sentToday: number; limit: number; left: number };
    }>('/collection/gift', { friendId, cardId }),
  openChest: (chestId: string) => post<ChestResponse>('/collection/chest', { chestId }),
  claimSet: (setId: string) => post<ClaimResponse>('/collection/set', { setId }),
  quests: () => request<{ quests: QuestState[] }>('/quests'),
  claimQuest: (questId: string) => post<ClaimResponse>('/quests/claim', { questId }),
  daily: () => request<{ daily: DailyState }>('/daily'),
  claimDaily: () => post<ClaimResponse>('/daily/claim'),
  tournament: () => request<{ tournament: TournamentState }>('/tournament'),
  claimTournament: () =>
    post<{ rank: number; coins: number; spins: number; tournament: TournamentState; state: PlayerState }>(
      '/tournament/claim',
    ),
  events: () =>
    request<{ event: EventState; upcoming: EventWindowInfo[] }>('/events'),
  wheel: () => request<{ wheel: WheelStatus; state: PlayerState }>('/wheel'),
  spinWheel: () => post<WheelResult>('/wheel/spin'),
  achievements: () =>
    request<{ achievements: AchievementState[]; state: PlayerState }>('/achievements'),
  claimAchievement: (id: string) =>
    post<{
      id: string;
      coins: number;
      spins: number;
      xp: number;
      levelUps: number;
      achievements: AchievementState[];
      state: PlayerState;
    }>('/achievements/claim', { id }),
  pets: () => request<{ pets: PetState[]; state: PlayerState }>('/pets'),
  feedPet: (petId: string) =>
    post<{ petId: string; cost: number; secondsLeft: number; pets: PetState[]; state: PlayerState }>(
      '/pets/feed',
      { petId },
    ),
  leaderboard: () => request<{ entries: LeaderboardEntry[] }>('/leaderboard'),
  history: () => request<{ entries: HistoryEntry[] }>('/history'),
};
