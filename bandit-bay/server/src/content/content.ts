import type {
  CardDef,
  CardSetDef,
  ChestDef,
  DailyRewardDef,
  QuestDef,
  Rarity,
  SymbolId,
  VillageDef,
} from '../types.js';

/* ------------------------------------------------------------------ */
/*  Grundwerte der Spielbalance                                        */
/* ------------------------------------------------------------------ */

export const BALANCE = {
  maxBuildingLevel: 5,
  maxShields: 3,
  /** Sekunden bis ein Spin nachwaechst */
  spinRegenSeconds: 180,
  /** Spin-Kapazitaet = base + level * perLevel (gedeckelt) */
  spinCapacityBase: 75,
  spinCapacityPerLevel: 3,
  spinCapacityMax: 300,
  startCoins: 25_000,
  startSpins: 75,
  /** Grundwert einer Taler-Auszahlung bei Einsatz x1 */
  coinBase: 90,
  coinPerLevel: 0.32,
  coinPerVillage: 0.55,
  /** XP-Kurve: xpForNextLevel(level) */
  xpBase: 260,
  xpExponent: 1.35,
  betTiers: [1, 2, 3, 5, 10, 25, 50, 100, 250, 500, 1000],
  /** Ab welchem Spielerlevel eine Einsatzstufe freigeschaltet ist */
  betTierLevels: [1, 3, 5, 8, 12, 16, 21, 27, 34, 42, 50],
  raidJackpotShare: 0.22,
  raidLootShare: 0.09,
  attackLootShare: 0.11,
} as const;

export function xpForNextLevel(level: number): number {
  return Math.round(BALANCE.xpBase * Math.pow(level, BALANCE.xpExponent));
}

export function spinCapacity(level: number): number {
  return Math.min(
    BALANCE.spinCapacityMax,
    BALANCE.spinCapacityBase + level * BALANCE.spinCapacityPerLevel,
  );
}

export function maxBetForLevel(level: number): number {
  let max = 1;
  for (let i = 0; i < BALANCE.betTiers.length; i++) {
    if (level >= BALANCE.betTierLevels[i]) max = BALANCE.betTiers[i];
  }
  return max;
}

/** Grundwert einer Münz-Auszahlung, abhaengig von Level und Insel. */
export function coinValue(level: number, villageId: number): number {
  return Math.round(
    BALANCE.coinBase *
      (1 + (level - 1) * BALANCE.coinPerLevel) *
      (1 + (villageId - 1) * BALANCE.coinPerVillage),
  );
}

/* ------------------------------------------------------------------ */
/*  Slot-Symbole                                                       */
/* ------------------------------------------------------------------ */

export interface SymbolDef {
  id: SymbolId;
  name: string;
  weight: number;
  color: string;
}

export const SYMBOLS: SymbolDef[] = [
  { id: 'taler', name: 'Taler', weight: 32, color: '#f6c343' },
  { id: 'beutel', name: 'Beutelchen', weight: 17, color: '#7cc6fe' },
  { id: 'schild', name: 'Schild', weight: 13, color: '#9fd356' },
  { id: 'hammer', name: 'Sturmhammer', weight: 15, color: '#ff8a5b' },
  { id: 'pfote', name: 'Banditenpfote', weight: 11, color: '#c792ea' },
  { id: 'truhe', name: 'Truhe', weight: 12, color: '#ffb0c8' },
];

/**
 * Gewinntabelle: Das Ergebnis wird gewichtet gezogen, danach werden die
 * Walzen passend dazu aufgebaut. So bleibt die Balance an einer Stelle
 * steuerbar (statt sich aus Symbolwahrscheinlichkeiten zu ergeben).
 */
export interface PayoutEntry {
  symbol: SymbolId;
  matches: 3 | 2;
  weight: number;
}

export const SPIN_TABLE: PayoutEntry[] = [
  { symbol: 'taler', matches: 3, weight: 9 },
  { symbol: 'beutel', matches: 3, weight: 4 },
  { symbol: 'schild', matches: 3, weight: 4 },
  { symbol: 'hammer', matches: 3, weight: 6 },
  { symbol: 'pfote', matches: 3, weight: 5 },
  { symbol: 'truhe', matches: 3, weight: 4 },
  { symbol: 'taler', matches: 2, weight: 16 },
  { symbol: 'beutel', matches: 2, weight: 8 },
  { symbol: 'schild', matches: 2, weight: 6 },
  { symbol: 'hammer', matches: 2, weight: 6 },
  { symbol: 'pfote', matches: 2, weight: 5 },
  { symbol: 'truhe', matches: 2, weight: 7 },
];

/** Gewicht für "kein Treffer" – gleiche Skala wie SPIN_TABLE. */
export const NO_MATCH_WEIGHT = 20;

/* ------------------------------------------------------------------ */
/*  Event: Talerregen                                                  */
/* ------------------------------------------------------------------ */

/**
 * Mehrmals täglich läuft der "Talerregen": alle Taler-Gewinne aus dem
 * Automaten sowie Beute aus Angriff und Raubzug zählen doppelt.
 * Die Fenster sind feste UTC-Zeiten, damit Server und Client dasselbe sehen.
 */
export const EVENT = {
  name: 'Talerregen',
  multiplier: 2,
  durationMinutes: 60,
  startHoursUtc: [6, 12, 18, 22],
} as const;

export interface EventStatus {
  name: string;
  multiplier: number;
  active: boolean;
  secondsLeft: number;
  secondsUntilNext: number;
}

export function eventStatus(now: number = Date.now()): EventStatus {
  const date = new Date(now);
  const dayStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const windows: { start: number; end: number }[] = [];
  for (const offsetDay of [-1, 0, 1]) {
    for (const hour of EVENT.startHoursUtc) {
      const start = dayStart + offsetDay * 86_400_000 + hour * 3_600_000;
      windows.push({ start, end: start + EVENT.durationMinutes * 60_000 });
    }
  }
  windows.sort((a, b) => a.start - b.start);

  const running = windows.find((window) => now >= window.start && now < window.end);
  if (running) {
    return {
      name: EVENT.name,
      multiplier: EVENT.multiplier,
      active: true,
      secondsLeft: Math.ceil((running.end - now) / 1000),
      secondsUntilNext: 0,
    };
  }
  const next = windows.find((window) => window.start > now);
  return {
    name: EVENT.name,
    multiplier: EVENT.multiplier,
    active: false,
    secondsLeft: 0,
    secondsUntilNext: next ? Math.ceil((next.start - now) / 1000) : 0,
  };
}

/** Aktueller Multiplikator auf Taler-Gewinne. */
export function eventMultiplier(now: number = Date.now()): number {
  return eventStatus(now).active ? EVENT.multiplier : 1;
}

/* ------------------------------------------------------------------ */
/*  Begleiter                                                          */
/* ------------------------------------------------------------------ */

export type PetEffect = 'raid' | 'attack' | 'coins';

export interface PetDef {
  id: string;
  name: string;
  animal: string;
  art: 'fuchs' | 'baer' | 'papagei';
  description: string;
  effect: PetEffect;
  /** Bonus als Faktor, z. B. 0.4 = +40 % */
  bonus: number;
  unlockVillage: number;
  baseCost: number;
  color: string;
}

/** Ein Begleiter bleibt nach dem Füttern so lange aktiv. */
export const PET_DURATION_HOURS = 4;

export const PETS: PetDef[] = [
  {
    id: 'fina',
    name: 'Fina',
    animal: 'Füchsin',
    art: 'fuchs',
    description: 'Schnüffelt die besten Verstecke aus: mehr Beute bei Raubzügen.',
    effect: 'raid',
    bonus: 0.4,
    unlockVillage: 1,
    baseCost: 12_000,
    color: '#ff9a3c',
  },
  {
    id: 'bodo',
    name: 'Bodo',
    animal: 'Bär',
    art: 'baer',
    description: 'Haut kräftig zu: mehr Beute bei Angriffen.',
    effect: 'attack',
    bonus: 0.5,
    unlockVillage: 2,
    baseCost: 60_000,
    color: '#b5834a',
  },
  {
    id: 'pia',
    name: 'Pia',
    animal: 'Papagei',
    art: 'papagei',
    description: 'Kreischt bei jedem Treffer: mehr Taler aus dem Automaten.',
    effect: 'coins',
    bonus: 0.25,
    unlockVillage: 3,
    baseCost: 160_000,
    color: '#4fc3a1',
  },
];

export function petById(id: string): PetDef | undefined {
  return PETS.find((pet) => pet.id === id);
}

/** Futterkosten steigen mit dem Spielerlevel. */
export function petCost(pet: PetDef, level: number): number {
  return Math.round((pet.baseCost * (1 + (level - 1) * 0.2)) / 100) * 100;
}

/* ------------------------------------------------------------------ */
/*  Meilensteine                                                       */
/* ------------------------------------------------------------------ */

export type AchievementMetric =
  | 'spins'
  | 'attacks'
  | 'raids'
  | 'level'
  | 'village'
  | 'cards'
  | 'sets';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  metric: AchievementMetric;
  target: number;
  reward: { coins: number; spins: number; xp: number };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'spins_100',
    name: 'Drehmeister I',
    description: '100 Mal am Automaten gedreht',
    metric: 'spins',
    target: 100,
    reward: { coins: 40_000, spins: 20, xp: 300 },
  },
  {
    id: 'spins_500',
    name: 'Drehmeister II',
    description: '500 Mal am Automaten gedreht',
    metric: 'spins',
    target: 500,
    reward: { coins: 250_000, spins: 60, xp: 1200 },
  },
  {
    id: 'attacks_25',
    name: 'Hammerzeit',
    description: '25 Angriffe ausgeführt',
    metric: 'attacks',
    target: 25,
    reward: { coins: 60_000, spins: 25, xp: 400 },
  },
  {
    id: 'attacks_100',
    name: 'Schrecken der Bucht',
    description: '100 Angriffe ausgeführt',
    metric: 'attacks',
    target: 100,
    reward: { coins: 400_000, spins: 70, xp: 1600 },
  },
  {
    id: 'raids_25',
    name: 'Schatzsucher',
    description: '25 Raubzüge durchgeführt',
    metric: 'raids',
    target: 25,
    reward: { coins: 80_000, spins: 25, xp: 450 },
  },
  {
    id: 'cards_10',
    name: 'Sammler',
    description: '10 verschiedene Karten gefunden',
    metric: 'cards',
    target: 10,
    reward: { coins: 70_000, spins: 30, xp: 500 },
  },
  {
    id: 'cards_30',
    name: 'Komplettist',
    description: 'Alle 30 Karten gefunden',
    metric: 'cards',
    target: 30,
    reward: { coins: 2_000_000, spins: 150, xp: 4000 },
  },
  {
    id: 'sets_3',
    name: 'Setjäger',
    description: '3 Karten-Sets eingelöst',
    metric: 'sets',
    target: 3,
    reward: { coins: 500_000, spins: 60, xp: 1500 },
  },
  {
    id: 'village_3',
    name: 'Inselhüpfer',
    description: 'Insel 3 erreicht',
    metric: 'village',
    target: 3,
    reward: { coins: 300_000, spins: 50, xp: 900 },
  },
  {
    id: 'village_6',
    name: 'Wolkenherrscher',
    description: 'Insel 6 erreicht',
    metric: 'village',
    target: 6,
    reward: { coins: 5_000_000, spins: 200, xp: 6000 },
  },
  {
    id: 'level_10',
    name: 'Aufsteiger',
    description: 'Level 10 erreicht',
    metric: 'level',
    target: 10,
    reward: { coins: 120_000, spins: 40, xp: 0 },
  },
  {
    id: 'level_25',
    name: 'Veteran',
    description: 'Level 25 erreicht',
    metric: 'level',
    target: 25,
    reward: { coins: 1_200_000, spins: 120, xp: 0 },
  },
];

export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((entry) => entry.id === id);
}

/* ------------------------------------------------------------------ */
/*  Inseln (Dörfer)                                                   */
/* ------------------------------------------------------------------ */

export const VILLAGES: VillageDef[] = [
  {
    id: 1,
    name: 'Nebelbucht',
    subtitle: 'Wo jede Banditenreise beginnt',
    setId: 'set_nebel',
    costMultiplier: 1,
    palette: { skyTop: '#8fd6ff', skyBottom: '#dff3ff', ground: '#7cc47f', accent: '#3d8b5f' },
    buildings: [
      { id: 'v1_hut', name: 'Treibholzhütte', kind: 'hut', baseCost: 900 },
      { id: 'v1_dock', name: 'Fischersteg', kind: 'dock', baseCost: 1200 },
      { id: 'v1_mill', name: 'Nussmühle', kind: 'mill', baseCost: 1600 },
      { id: 'v1_market', name: 'Muschelmarkt', kind: 'market', baseCost: 2100 },
      { id: 'v1_statue', name: 'Waschbär-Statue', kind: 'statue', baseCost: 2800 },
    ],
  },
  {
    id: 2,
    name: 'Sonnenriff',
    subtitle: 'Warmes Wasser, heisse Beute',
    setId: 'set_sonne',
    costMultiplier: 2.4,
    palette: { skyTop: '#ffd36e', skyBottom: '#ffeec2', ground: '#f3d9a4', accent: '#e08b3c' },
    buildings: [
      { id: 'v2_hut', name: 'Korallenhaus', kind: 'hut', baseCost: 1100 },
      { id: 'v2_dock', name: 'Perlentaucher-Pier', kind: 'dock', baseCost: 1500 },
      { id: 'v2_forge', name: 'Sonnenschmiede', kind: 'forge', baseCost: 2000 },
      { id: 'v2_market', name: 'Riffbasar', kind: 'market', baseCost: 2600 },
      { id: 'v2_lighthouse', name: 'Bernsteinleuchtturm', kind: 'lighthouse', baseCost: 3400 },
    ],
  },
  {
    id: 3,
    name: 'Dschungeltiefe',
    subtitle: 'Ranken, Ruinen und Raubzüge',
    setId: 'set_dschungel',
    costMultiplier: 5.6,
    palette: { skyTop: '#7ae0c3', skyBottom: '#d9fff2', ground: '#4fa86b', accent: '#26694a' },
    buildings: [
      { id: 'v3_hut', name: 'Baumkronenlager', kind: 'hut', baseCost: 1400 },
      { id: 'v3_mill', name: 'Lianenmühle', kind: 'mill', baseCost: 1900 },
      { id: 'v3_statue', name: 'Moosgötze', kind: 'statue', baseCost: 2500 },
      { id: 'v3_tower', name: 'Rankenturm', kind: 'tower', baseCost: 3300 },
      { id: 'v3_market', name: 'Fruchthandelsposten', kind: 'market', baseCost: 4300 },
    ],
  },
  {
    id: 4,
    name: 'Sturmklippe',
    subtitle: 'Nur die Zähesten bauen hier',
    setId: 'set_sturm',
    costMultiplier: 13,
    palette: { skyTop: '#6f7ea8', skyBottom: '#c6d2ec', ground: '#8a93a8', accent: '#3d4867' },
    buildings: [
      { id: 'v4_hut', name: 'Windfeste Kate', kind: 'hut', baseCost: 1800 },
      { id: 'v4_forge', name: 'Blitzschmiede', kind: 'forge', baseCost: 2400 },
      { id: 'v4_tower', name: 'Donnerturm', kind: 'tower', baseCost: 3200 },
      { id: 'v4_dock', name: 'Sturmhafen', kind: 'dock', baseCost: 4200 },
      { id: 'v4_lighthouse', name: 'Wetterwarte', kind: 'lighthouse', baseCost: 5600 },
    ],
  },
  {
    id: 5,
    name: 'Kristallgrotte',
    subtitle: 'Funkelnde Höhlen voller Taler',
    setId: 'set_kristall',
    costMultiplier: 30,
    palette: { skyTop: '#9d7bff', skyBottom: '#e8dcff', ground: '#7d6bb5', accent: '#4b3a86' },
    buildings: [
      { id: 'v5_hut', name: 'Geodenheim', kind: 'hut', baseCost: 2300 },
      { id: 'v5_mill', name: 'Splittermühle', kind: 'mill', baseCost: 3100 },
      { id: 'v5_forge', name: 'Prismenschmiede', kind: 'forge', baseCost: 4100 },
      { id: 'v5_statue', name: 'Kristallwächter', kind: 'statue', baseCost: 5400 },
      { id: 'v5_tower', name: 'Glimmerturm', kind: 'tower', baseCost: 7200 },
    ],
  },
  {
    id: 6,
    name: 'Wolkenhafen',
    subtitle: 'Die letzte Insel über den Wolken',
    setId: 'set_wolken',
    costMultiplier: 68,
    palette: { skyTop: '#ff9ec4', skyBottom: '#fff0f6', ground: '#cbb7f2', accent: '#8657c9' },
    buildings: [
      { id: 'v6_dock', name: 'Luftschiffwerft', kind: 'dock', baseCost: 3000 },
      { id: 'v6_market', name: 'Wolkenmarkt', kind: 'market', baseCost: 4000 },
      { id: 'v6_tower', name: 'Sternwarte', kind: 'tower', baseCost: 5300 },
      { id: 'v6_statue', name: 'Grosser Bandit', kind: 'statue', baseCost: 7000 },
      { id: 'v6_lighthouse', name: 'Himmelsfeuer', kind: 'lighthouse', baseCost: 9300 },
    ],
  },
];

export const MAX_VILLAGE = VILLAGES.length;

export function getVillage(id: number): VillageDef {
  const v = VILLAGES.find((x) => x.id === id);
  if (!v) throw new Error(`Unbekannte Insel: ${id}`);
  return v;
}

/** Kosten für das nächste Level eines Gebäudes. */
export function upgradeCost(villageId: number, buildingIndex: number, currentLevel: number): number {
  const village = getVillage(villageId);
  const building = village.buildings[buildingIndex];
  if (!building) throw new Error(`Unbekanntes Gebäude: ${villageId}/${buildingIndex}`);
  const raw = building.baseCost * village.costMultiplier * Math.pow(1.62, currentLevel);
  return Math.max(100, Math.round(raw / 50) * 50);
}

/* ------------------------------------------------------------------ */
/*  Sammelkarten                                                       */
/* ------------------------------------------------------------------ */

export const CARD_SETS: CardSetDef[] = [
  {
    id: 'set_nebel',
    name: 'Nebelbucht',
    villageId: 1,
    reward: { coins: 120_000, spins: 40, xp: 400, shields: 1 },
  },
  {
    id: 'set_sonne',
    name: 'Sonnenriff',
    villageId: 2,
    reward: { coins: 420_000, spins: 60, xp: 800, shields: 1 },
  },
  {
    id: 'set_dschungel',
    name: 'Dschungeltiefe',
    villageId: 3,
    reward: { coins: 1_400_000, spins: 90, xp: 1500, shields: 2 },
  },
  {
    id: 'set_sturm',
    name: 'Sturmklippe',
    villageId: 4,
    reward: { coins: 4_200_000, spins: 130, xp: 2600, shields: 2 },
  },
  {
    id: 'set_kristall',
    name: 'Kristallgrotte',
    villageId: 5,
    reward: { coins: 12_000_000, spins: 180, xp: 4200, shields: 3 },
  },
  {
    id: 'set_wolken',
    name: 'Wolkenhafen',
    villageId: 6,
    reward: { coins: 40_000_000, spins: 250, xp: 7000, shields: 3 },
  },
];

function card(
  id: string,
  name: string,
  setId: string,
  rarity: Rarity,
  art: CardDef['art'],
  color: string,
): CardDef {
  return { id, name, setId, rarity, art, color };
}

export const CARDS: CardDef[] = [
  // Set 1 – Nebelbucht
  card('c_rufus', 'Rufus der Bandit', 'set_nebel', 3, 'raccoon', '#8d7ae6'),
  card('c_steg', 'Alter Steg', 'set_nebel', 1, 'ship', '#6fb1d8'),
  card('c_nebelkarte', 'Nebelkarte', 'set_nebel', 2, 'map', '#d9b382'),
  card('c_muschel', 'Glücksmuschel', 'set_nebel', 2, 'gem', '#f2a7c3'),
  card('c_silberfisch', 'Silberfisch', 'set_nebel', 4, 'fish', '#9fd3e8'),
  // Set 2 – Sonnenriff
  card('c_perle', 'Riesenperle', 'set_sonne', 3, 'gem', '#ffd6e8'),
  card('c_taucher', 'Taucherlampe', 'set_sonne', 2, 'lantern', '#ffc46b'),
  card('c_korall', 'Korallenkrone', 'set_sonne', 4, 'crown', '#ff8f6b'),
  card('c_segel', 'Sonnensegler', 'set_sonne', 1, 'ship', '#ffe28a'),
  card('c_riffwacht', 'Riffwächter', 'set_sonne', 5, 'mask', '#f97e72'),
  // Set 3 – Dschungeltiefe
  card('c_idol', 'Moos-Idol', 'set_dschungel', 4, 'mask', '#5fae7c'),
  card('c_ranke', 'Goldene Ranke', 'set_dschungel', 2, 'leaf', '#79c66b'),
  card('c_papagei', 'Lautsprecher-Papagei', 'set_dschungel', 3, 'star', '#4fc3a1'),
  card('c_karte3', 'Ruinenplan', 'set_dschungel', 1, 'map', '#cbb185'),
  card('c_smaragd', 'Dschungelsmaragd', 'set_dschungel', 5, 'gem', '#2fd6a1'),
  // Set 4 – Sturmklippe
  card('c_blitz', 'Blitzsplitter', 'set_sturm', 3, 'star', '#ffe066'),
  card('c_anker', 'Sturmanker', 'set_sturm', 2, 'ship', '#8fa2c9'),
  card('c_laterne', 'Wetterlaterne', 'set_sturm', 4, 'lantern', '#b4c7f0'),
  card('c_klippe', 'Klippenkarte', 'set_sturm', 1, 'map', '#9aa5bd'),
  card('c_donnerherz', 'Donnerherz', 'set_sturm', 5, 'gem', '#6f7fd8'),
  // Set 5 – Kristallgrotte
  card('c_geode', 'Zwillingsgeode', 'set_kristall', 3, 'gem', '#c79bff'),
  card('c_prisma', 'Prismafisch', 'set_kristall', 2, 'fish', '#a48bf0'),
  card('c_kristallkrone', 'Kristallkrone', 'set_kristall', 4, 'crown', '#e0c3ff'),
  card('c_glimmer', 'Glimmerblatt', 'set_kristall', 1, 'leaf', '#9d7bff'),
  card('c_grottenwacht', 'Grottenwächter', 'set_kristall', 5, 'mask', '#7b52d6'),
  // Set 6 – Wolkenhafen
  card('c_ballon', 'Wolkenballon', 'set_wolken', 2, 'ship', '#ffb3d1'),
  card('c_stern', 'Morgenstern', 'set_wolken', 3, 'star', '#ffe9a8'),
  card('c_himmelskrone', 'Himmelskrone', 'set_wolken', 4, 'crown', '#ffd0e4'),
  card('c_wolkenkarte', 'Himmelsatlas', 'set_wolken', 1, 'map', '#e5d5ff'),
  card('c_grossbandit', 'Grosser Bandit', 'set_wolken', 5, 'raccoon', '#ff7ea8'),
];

export function cardById(id: string): CardDef | undefined {
  return CARDS.find((c) => c.id === id);
}

export function cardsOfSet(setId: string): CardDef[] {
  return CARDS.filter((c) => c.setId === setId);
}

/** Duplikat-Auszahlung in Talern (skaliert mit Seltenheit und Level). */
export function duplicateValue(rarity: Rarity, level: number): number {
  return Math.round(1200 * rarity * (1 + level * 0.3));
}

/** Gewichte für Kartenzug nach Seltenheit. */
export const RARITY_WEIGHTS: Record<Rarity, number> = { 1: 42, 2: 28, 3: 17, 4: 9, 5: 4 };

export const CHESTS: ChestDef[] = [
  { id: 'chest_wood', name: 'Treibholztruhe', baseCost: 30_000, cards: 2, minRarity: 1, color: '#c89b6a' },
  { id: 'chest_silver', name: 'Silbertruhe', baseCost: 120_000, cards: 4, minRarity: 2, color: '#b9c6d6' },
  { id: 'chest_gold', name: 'Goldtruhe', baseCost: 400_000, cards: 6, minRarity: 3, color: '#f6c343' },
];

/** Truhenpreis steigt mit dem Spielerlevel. */
export function chestCost(chest: ChestDef, level: number): number {
  return Math.round((chest.baseCost * (1 + (level - 1) * 0.22)) / 100) * 100;
}

/* ------------------------------------------------------------------ */
/*  Quests & Tagesbelohnungen                                          */
/* ------------------------------------------------------------------ */

export const QUESTS: QuestDef[] = [
  {
    id: 'q_spin',
    name: 'Dreh den Bandit',
    description: 'Drehe 25 Mal am Automaten',
    type: 'spin',
    target: 25,
    reward: { coins: 15_000, spins: 10, xp: 120 },
  },
  {
    id: 'q_upgrade',
    name: 'Baumeister',
    description: 'Verbessere 3 Gebäude',
    type: 'upgrade',
    target: 3,
    reward: { coins: 25_000, spins: 12, xp: 180 },
  },
  {
    id: 'q_attack',
    name: 'Krawallmacher',
    description: 'Führe 3 Angriffe aus',
    type: 'attack',
    target: 3,
    reward: { coins: 20_000, spins: 8, xp: 150 },
  },
  {
    id: 'q_raid',
    name: 'Schatzgräber',
    description: 'Führe 2 Raubzüge aus',
    type: 'raid',
    target: 2,
    reward: { coins: 30_000, spins: 8, xp: 160 },
  },
  {
    id: 'q_cards',
    name: 'Sammlerherz',
    description: 'Finde 3 Karten',
    type: 'cards',
    target: 3,
    reward: { coins: 18_000, spins: 10, xp: 140 },
  },
];

export const DAILY_LADDER: DailyRewardDef[] = [
  { day: 1, coins: 10_000, spins: 10, shields: 0, cards: 0 },
  { day: 2, coins: 20_000, spins: 15, shields: 1, cards: 0 },
  { day: 3, coins: 35_000, spins: 20, shields: 0, cards: 1 },
  { day: 4, coins: 60_000, spins: 25, shields: 1, cards: 1 },
  { day: 5, coins: 95_000, spins: 30, shields: 1, cards: 1 },
  { day: 6, coins: 150_000, spins: 40, shields: 2, cards: 2 },
  { day: 7, coins: 250_000, spins: 60, shields: 3, cards: 3 },
];

/* ------------------------------------------------------------------ */
/*  Bots (Mitspieler-Insel-Bewohner)                                   */
/* ------------------------------------------------------------------ */

export const BOT_NAMES: { name: string; avatar: string }[] = [
  { name: 'Miko Maske', avatar: '🦝' },
  { name: 'Kapitän Klaus', avatar: '🐧' },
  { name: 'Perla', avatar: '🦦' },
  { name: 'Sturm-Sina', avatar: '🦊' },
  { name: 'Dodo Dietz', avatar: '🦜' },
  { name: 'Grottengreta', avatar: '🦇' },
  { name: 'Fischer Fips', avatar: '🐟' },
  { name: 'Wolken-Wanja', avatar: '☁️' },
  { name: 'Bommel', avatar: '🐻' },
  { name: 'Nane Nuss', avatar: '🐿️' },
  { name: 'Rikko Riff', avatar: '🐙' },
  { name: 'Tante Tilda', avatar: '🦉' },
];

export const PLAYER_AVATARS = ['🦝', '🦊', '🐻', '🐼', '🦉', '🐧', '🦦', '🐿️', '🦜', '🐙'];
