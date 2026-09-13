/** Gemeinsame Typen fuer Server und (per JSON-API) Client. */

export type SymbolId = 'taler' | 'beutel' | 'hammer' | 'pfote' | 'schild' | 'truhe' | 'joker';

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
  wildChance?: number;
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

export type PetArt = 'fuchs' | 'baer' | 'papagei' | 'erdmaennchen' | 'otter';
export type PetEffectKind = 'raid' | 'attack' | 'coins' | 'shield' | 'cards';

export interface ActivePetState {
  id: string;
  name: string;
  art: PetArt;
  effect: PetEffectKind;
  bonus: number;
  level: number;
  abilityName: string;
  secondsLeft: number;
}

export type EventKind = 'taler' | 'beutel' | 'raub' | 'schild';

export interface EventState {
  kind: EventKind | null;
  name: string;
  icon: string;
  short: string;
  description: string;
  color: string;
  active: boolean;
  secondsLeft: number;
  secondsUntilNext: number;
  nextKind: EventKind | null;
  nextName: string;
}

export interface EventWindowInfo {
  kind: EventKind;
  name: string;
  icon: string;
  short: string;
  color: string;
  start: number;
  end: number;
  active: boolean;
}

export type DecoArt =
  | 'palme'
  | 'blumen'
  | 'fackel'
  | 'brunnen'
  | 'zaun'
  | 'statue'
  | 'fahne'
  | 'lagerfeuer';

export interface PlacedDeco {
  slot: number;
  id: string;
  name: string;
  art: DecoArt;
  color: string;
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
  wildcards: number;
  stats: { attacks: number; raids: number; timesRaided: number; spins: number };
  event: EventState;
  activePet: ActivePetState | null;
  decorations: PlacedDeco[];
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
  /** Ein Joker hat den Treffer vervollständigt. */
  wild?: boolean;
  /** Pia hat die Drehung zurückgegeben. */
  refunded?: boolean;
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
  /** Zweites Gebäude, falls Bodos Doppelschlag ausgelöst hat. */
  secondSpotIndex: number | null;
  secondBuildingName: string;
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
  | 'pet'
  | 'wheel'
  | 'tournament'
  | 'gift'
  | 'gifted'
  | 'wildcard'
  | 'deco';

export interface HistoryEntry {
  id: number;
  type: HistoryType;
  otherName: string;
  otherId?: string;
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

/* ---------- Client-seitige Ergaenzungen (API-Antworten) ---------- */

export interface SymbolDef {
  id: SymbolId;
  name: string;
  weight: number;
  color: string;
}

export interface GameConfig {
  villages: VillageDef[];
  symbols: SymbolDef[];
  cards: CardDef[];
  cardSets: (CardSetDef & { cardIds: string[] })[];
  chests: ChestDef[];
  quests: QuestDef[];
  dailyLadder: DailyRewardDef[];
  petDurationHours: number;
  avatars: string[];
  eventTypes: { kind: EventKind; name: string; icon: string; description: string; short: string; color: string }[];
  balance: {
    maxBuildingLevel: number;
    maxShields: number;
    spinRegenSeconds: number;
    betTiers: number[];
    betTierLevels: number[];
  };
}

export interface TargetInfo {
  id: string;
  name: string;
  avatar: string;
  level: number;
  villageId: number;
  villageName: string;
  isBot: boolean;
  shields: number;
  buildings: { index: number; name: string; kind: BuildingKind; level: number }[];
  estimatedLoot: number;
}

export interface TournamentEntry {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  level: number;
  points: number;
  isBot: boolean;
  isMe: boolean;
}

export interface TournamentPrize {
  from: number;
  to: number;
  label: string;
  coins: number;
  spins: number;
  wildcards?: number;
}

export interface TournamentState {
  name: string;
  cycle: number;
  endsInSeconds: number;
  myPoints: number;
  myRank: number;
  entries: TournamentEntry[];
  prizes: TournamentPrize[];
  reward: {
    available: boolean;
    rank: number;
    label: string;
    coins: number;
    spins: number;
    wildcards: number;
  } | null;
}

export interface WheelSegmentView {
  id: string;
  label: string;
  kind: 'coins' | 'spins' | 'shield' | 'card' | 'jackpot';
  color: string;
  amount: number;
}

export interface WheelStatus {
  canSpin: boolean;
  secondsUntilNext: number;
  segments: WheelSegmentView[];
}

export interface WheelResult {
  index: number;
  segment: WheelSegmentView;
  coins: number;
  spins: number;
  shields: number;
  card: CardDrop | null;
  levelUps: number;
  wheel: WheelStatus;
  state: PlayerState;
}

export interface AchievementState {
  id: string;
  name: string;
  description: string;
  target: number;
  progress: number;
  done: boolean;
  claimed: boolean;
  reward: { coins: number; spins: number; xp: number };
}

export interface PetState {
  id: string;
  name: string;
  animal: string;
  art: PetArt;
  description: string;
  effect: PetEffectKind;
  bonus: number;
  ability: string;
  abilityName: string;
  abilityText: string;
  abilityChance: number;
  color: string;
  unlockVillage: number;
  unlocked: boolean;
  cost: number;
  active: boolean;
  secondsLeft: number;
  feeds: number;
  level: number;
  maxLevel: number;
  feedsToNextLevel: number;
}

export interface DecoOffer {
  id: string;
  name: string;
  art: DecoArt;
  color: string;
  cost: number;
}

export interface DecoState {
  villageId: number;
  slots: number;
  offers: DecoOffer[];
  placed: PlacedDeco[];
}

export interface VillageOverview {
  id: number;
  name: string;
  subtitle: string;
  palette: { skyTop: string; skyBottom: string; ground: string; accent: string };
  unlocked: boolean;
  current: boolean;
  progress: number;
  buildings: { name: string; kind: BuildingKind; level: number; maxLevel: number }[];
}

export interface FriendInfo extends TargetInfo {
  since: number;
}

export interface SetProgress {
  id: string;
  name: string;
  villageId: number;
  reward: { coins: number; spins: number; xp: number; shields?: number };
  total: number;
  owned: number;
  complete: boolean;
  claimed: boolean;
}

export interface CardDrop {
  card: CardDef;
  isNew: boolean;
  coins: number;
}

export interface ChestOffer extends ChestDef {
  cost: number;
}

export interface UpgradeResponse {
  cost: number;
  index: number;
  newLevel: number;
  levelUps: number;
  villageComplete: boolean;
  newVillageId: number;
  state: PlayerState;
}

export interface ClaimResponse {
  ok: boolean;
  coins: number;
  spins: number;
  xp: number;
  shields: number;
  levelUps: number;
  cards: number;
  drops?: CardDrop[];
  quests?: QuestState[];
  daily?: DailyState;
  state: PlayerState;
}

export interface ChestResponse {
  ok: boolean;
  cost: number;
  drops: CardDrop[];
  /** Gefundene Banditenmasken. */
  wilds: number;
  state: PlayerState;
}

export interface WildcardResponse {
  card: CardDef;
  left: number;
  state: PlayerState;
}
