/** Gemeinsame Typen für Server und (per JSON-API) Client. */

export type SymbolId = 'taler' | 'beutel' | 'hammer' | 'pfote' | 'schild' | 'truhe';

export type BuildingKind =
  | 'hut'
  | 'dock'
  | 'mill'
  | 'tower'
  | 'statue'
  | 'market'
  | 'forge'
  | 'lighthouse';

export type CardArt =
  | 'raccoon'
  | 'ship'
  | 'map'
  | 'gem'
  | 'fish'
  | 'lantern'
  | 'mask'
  | 'crown'
  | 'leaf'
  | 'star';

export type Rarity = 1 | 2 | 3 | 4 | 5;

export interface BuildingDef {
  id: string;
  name: string;
  kind: BuildingKind;
  baseCost: number;
}

export interface VillageDef {
  id: number;
  name: string;
  subtitle: string;
  setId: string;
  costMultiplier: number;
  palette: { skyTop: string; skyBottom: string; ground: string; accent: string };
  buildings: BuildingDef[];
}

export interface CardDef {
  id: string;
  name: string;
  setId: string;
  rarity: Rarity;
  art: CardArt;
  color: string;
}

export interface CardSetDef {
  id: string;
  name: string;
  villageId: number;
  reward: { coins: number; spins: number; xp: number; shields?: number };
}

export interface ChestDef {
  id: string;
  name: string;
  baseCost: number;
  cards: number;
  minRarity: Rarity;
  color: string;
}

export type QuestType = 'spin' | 'upgrade' | 'attack' | 'raid' | 'coins' | 'cards';

export interface QuestDef {
  id: string;
  name: string;
  description: string;
  type: QuestType;
  target: number;
  reward: { coins: number; spins: number; xp: number };
}

export interface DailyRewardDef {
  day: number;
  coins: number;
  spins: number;
  shields: number;
  cards: number;
}

/* ---------- Laufzeit-Zustand ---------- */

export interface PublicUser {
  id: string;
  name: string;
  avatar: string;
  level: number;
  villageId: number;
  isBot: boolean;
  shields: number;
  coins: number;
}

export interface ActivePetState {
  id: string;
  name: string;
  art: 'fuchs' | 'baer' | 'papagei';
  effect: 'raid' | 'attack' | 'coins';
  bonus: number;
  secondsLeft: number;
}

export interface EventState {
  name: string;
  multiplier: number;
  active: boolean;
  secondsLeft: number;
  secondsUntilNext: number;
}

export interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  isBot: boolean;
  coins: number;
  spins: number;
  spinCapacity: number;
  nextSpinInSeconds: number;
  shields: number;
  maxShields: number;
  level: number;
  xp: number;
  xpForNextLevel: number;
  bet: number;
  maxBet: number;
  villageId: number;
  villageProgress: number;
  pendingAttacks: number;
  pendingRaids: number;
  stats: { attacks: number; raids: number; timesRaided: number; spins: number };
  event: EventState;
  activePet: ActivePetState | null;
  buildings: BuildingState[];
  cards: Record<string, number>;
  claimedSets: string[];
}

export interface BuildingState {
  villageId: number;
  index: number;
  level: number;
  maxLevel: number;
  cost: number;
}

export type SpinOutcomeType =
  | 'coins'
  | 'spins'
  | 'shield'
  | 'attack'
  | 'raid'
  | 'card'
  | 'nothing';

export interface SpinResult {
  reels: SymbolId[];
  matches: 3 | 2 | 0;
  outcome: SpinOutcomeType;
  amount: number;
  card?: CardDef;
  cardIsNew?: boolean;
  message: string;
  levelUps: number;
  state: PlayerState;
}

export interface AttackResult {
  blocked: boolean;
  destroyed: boolean;
  spotIndex: number;
  loot: number;
  targetName: string;
  targetBuildingName: string;
  message: string;
  levelUps: number;
  state: PlayerState;
}

export interface RaidSpot {
  index: number;
  kind: 'jackpot' | 'loot' | 'empty';
  amount: number;
}

export interface RaidResult {
  spots: RaidSpot[];
  pickedIndex: number;
  loot: number;
  targetName: string;
  message: string;
  levelUps: number;
  state: PlayerState;
}

export interface QuestState {
  id: string;
  name: string;
  description: string;
  target: number;
  progress: number;
  claimed: boolean;
  reward: { coins: number; spins: number; xp: number };
}

export interface DailyState {
  streak: number;
  canClaim: boolean;
  nextDay: number;
  ladder: DailyRewardDef[];
}

export type HistoryType =
  | 'attack'
  | 'raid'
  | 'attacked'
  | 'raided'
  | 'quest'
  | 'daily'
  | 'village'
  | 'chest'
  | 'set'
  | 'upgrade'
  | 'blocked'
  | 'spin'
  | 'pet';

export interface HistoryEntry {
  id: number;
  type: HistoryType;
  otherName: string;
  amount: number;
  detail: string;
  createdAt: number;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  level: number;
  villageId: number;
  coins: number;
  isBot: boolean;
  isMe: boolean;
}
