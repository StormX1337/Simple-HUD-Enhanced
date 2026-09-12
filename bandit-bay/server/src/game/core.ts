import crypto from 'node:crypto';
import { db, now, type UserRow, type BuildingRow, type CardRow } from '../db.js';
import type { BuildingState, PlayerState, PublicUser } from '../types.js';
import {
  BALANCE,
  MAX_VILLAGE,
  PLAYER_AVATARS,
  getVillage,
  maxBetForLevel,
  spinCapacity,
  upgradeCost,
  xpForNextLevel,
} from '../content/content.js';

/* ------------------------------------------------------------------ */
/*  Zufall                                                             */
/* ------------------------------------------------------------------ */

export function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function pickWeighted<T>(items: T[], weight: (item: T) => number): T {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= weight(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

/* ------------------------------------------------------------------ */
/*  Nutzer laden / speichern                                           */
/* ------------------------------------------------------------------ */

const selectUserById = () => db.prepare<[string], UserRow>('SELECT * FROM users WHERE id = ?');
const selectUserByToken = () => db.prepare<[string], UserRow>('SELECT * FROM users WHERE token = ?');
const selectUserByName = () =>
  db.prepare<[string], UserRow>('SELECT * FROM users WHERE lower(name) = lower(?)');

export function getUserById(id: string): UserRow | undefined {
  return selectUserById().get(id);
}

export function getUserByToken(token: string): UserRow | undefined {
  return selectUserByToken().get(token);
}

export function getUserByName(name: string): UserRow | undefined {
  return selectUserByName().get(name);
}

export function saveUser(user: UserRow): void {
  user.updated_at = now();
  db.prepare(
    `UPDATE users SET
       name = @name, avatar = @avatar, coins = @coins, spins = @spins, shields = @shields,
       level = @level, xp = @xp, village = @village, bet = @bet,
       pending_attacks = @pending_attacks, pending_raids = @pending_raids,
       last_regen = @last_regen, total_spins = @total_spins, total_attacks = @total_attacks,
       total_raids = @total_raids, times_raided = @times_raided, updated_at = @updated_at
     WHERE id = @id`,
  ).run(user);
}

export function createUser(opts: {
  name: string;
  isBot?: boolean;
  avatar?: string;
  coins?: number;
  spins?: number;
  level?: number;
  village?: number;
}): UserRow {
  const ts = now();
  const user: UserRow = {
    id: crypto.randomUUID(),
    name: opts.name,
    token: crypto.randomBytes(24).toString('hex'),
    avatar: opts.avatar ?? PLAYER_AVATARS[randInt(0, PLAYER_AVATARS.length - 1)],
    is_bot: opts.isBot ? 1 : 0,
    coins: opts.coins ?? BALANCE.startCoins,
    spins: opts.spins ?? BALANCE.startSpins,
    shields: 0,
    level: opts.level ?? 1,
    xp: 0,
    village: opts.village ?? 1,
    bet: 1,
    pending_attacks: 0,
    pending_raids: 0,
    last_regen: ts,
    total_spins: 0,
    total_attacks: 0,
    total_raids: 0,
    times_raided: 0,
    created_at: ts,
    updated_at: ts,
  };
  db.prepare(
    `INSERT INTO users (id, name, token, avatar, is_bot, coins, spins, shields, level, xp, village,
       bet, pending_attacks, pending_raids, last_regen, total_spins, total_attacks, total_raids,
       times_raided, created_at, updated_at)
     VALUES (@id, @name, @token, @avatar, @is_bot, @coins, @spins, @shields, @level, @xp, @village,
       @bet, @pending_attacks, @pending_raids, @last_regen, @total_spins, @total_attacks,
       @total_raids, @times_raided, @created_at, @updated_at)`,
  ).run(user);
  ensureBuildings(user.id, user.village);
  db.prepare('INSERT OR IGNORE INTO daily (user_id, streak, last_day) VALUES (?, 0, ?)').run(
    user.id,
    '',
  );
  return user;
}

/* ------------------------------------------------------------------ */
/*  Gebaeude                                                           */
/* ------------------------------------------------------------------ */

export function ensureBuildings(userId: string, villageId: number): void {
  const village = getVillage(villageId);
  const insert = db.prepare(
    'INSERT OR IGNORE INTO buildings (user_id, village, idx, level) VALUES (?, ?, ?, 0)',
  );
  const tx = db.transaction(() => {
    village.buildings.forEach((_, index) => insert.run(userId, villageId, index));
  });
  tx();
}

export function getBuildings(userId: string, villageId: number): BuildingRow[] {
  ensureBuildings(userId, villageId);
  return db
    .prepare<[string, number], BuildingRow>(
      'SELECT * FROM buildings WHERE user_id = ? AND village = ? ORDER BY idx',
    )
    .all(userId, villageId);
}

export function buildingStates(userId: string, villageId: number): BuildingState[] {
  return getBuildings(userId, villageId).map((row) => ({
    villageId,
    index: row.idx,
    level: row.level,
    maxLevel: BALANCE.maxBuildingLevel,
    cost: upgradeCost(villageId, row.idx, row.level),
  }));
}

export function villageProgress(userId: string, villageId: number): number {
  const rows = getBuildings(userId, villageId);
  const total = rows.length * BALANCE.maxBuildingLevel;
  const done = rows.reduce((sum, row) => sum + row.level, 0);
  return total === 0 ? 0 : done / total;
}

/* ------------------------------------------------------------------ */
/*  Spins & Regeneration                                               */
/* ------------------------------------------------------------------ */

export function applyRegen(user: UserRow): UserRow {
  const capacity = spinCapacity(user.level);
  const interval = BALANCE.spinRegenSeconds * 1000;
  const ts = now();
  if (user.spins >= capacity) {
    user.last_regen = ts;
    return user;
  }
  const elapsed = Math.max(0, ts - user.last_regen);
  const gained = Math.floor(elapsed / interval);
  if (gained > 0) {
    user.spins = Math.min(capacity, user.spins + gained);
    user.last_regen = user.spins >= capacity ? ts : user.last_regen + gained * interval;
  }
  return user;
}

export function nextSpinInSeconds(user: UserRow): number {
  const capacity = spinCapacity(user.level);
  if (user.spins >= capacity) return 0;
  const interval = BALANCE.spinRegenSeconds * 1000;
  const remaining = interval - (now() - user.last_regen);
  return Math.max(1, Math.ceil(remaining / 1000));
}

/* ------------------------------------------------------------------ */
/*  Bots verdienen passiv Taler                                        */
/* ------------------------------------------------------------------ */

export function refreshBot(user: UserRow): UserRow {
  if (!user.is_bot) return user;
  const ts = now();
  const minutes = Math.floor((ts - user.updated_at) / 60_000);
  if (minutes <= 0) return user;
  const income = Math.round(user.level * 900 * Math.pow(1.35, user.village - 1));
  const cap = Math.round(income * 600);
  if (user.coins < cap) {
    user.coins = Math.min(cap, user.coins + minutes * income);
    if (user.shields < BALANCE.maxShields && Math.random() < 0.35) user.shields += 1;
    saveUser(user);
  }
  return user;
}

/* ------------------------------------------------------------------ */
/*  Erfahrung & Level                                                  */
/* ------------------------------------------------------------------ */

export function addXp(user: UserRow, amount: number): number {
  if (amount <= 0) return 0;
  user.xp += Math.round(amount);
  let levelUps = 0;
  while (user.xp >= xpForNextLevel(user.level)) {
    user.xp -= xpForNextLevel(user.level);
    user.level += 1;
    levelUps += 1;
    // Level-Up-Belohnung
    user.spins = Math.min(spinCapacity(user.level), user.spins + 10);
    user.coins += Math.round(3000 * user.level * Math.pow(1.25, user.village - 1));
    if (user.level % 5 === 0 && user.shields < BALANCE.maxShields) user.shields += 1;
  }
  return levelUps;
}

/* ------------------------------------------------------------------ */
/*  Karten-Besitz                                                      */
/* ------------------------------------------------------------------ */

export function getCards(userId: string): Record<string, number> {
  const rows = db
    .prepare<[string], CardRow>('SELECT * FROM cards WHERE user_id = ?')
    .all(userId);
  const out: Record<string, number> = {};
  for (const row of rows) out[row.card_id] = row.count;
  return out;
}

export function getClaimedSets(userId: string): string[] {
  return db
    .prepare<[string], { set_id: string }>('SELECT set_id FROM card_sets WHERE user_id = ?')
    .all(userId)
    .map((row) => row.set_id);
}

/* ------------------------------------------------------------------ */
/*  Zustand fuer den Client                                            */
/* ------------------------------------------------------------------ */

export function buildState(user: UserRow): PlayerState {
  const maxBet = maxBetForLevel(user.level);
  if (user.bet > maxBet) {
    user.bet = maxBet;
    saveUser(user);
  }
  return {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    isBot: !!user.is_bot,
    coins: user.coins,
    spins: user.spins,
    spinCapacity: spinCapacity(user.level),
    nextSpinInSeconds: nextSpinInSeconds(user),
    shields: user.shields,
    maxShields: BALANCE.maxShields,
    level: user.level,
    xp: user.xp,
    xpForNextLevel: xpForNextLevel(user.level),
    bet: user.bet,
    maxBet,
    villageId: user.village,
    villageProgress: villageProgress(user.id, user.village),
    pendingAttacks: user.pending_attacks,
    pendingRaids: user.pending_raids,
    stats: {
      attacks: user.total_attacks,
      raids: user.total_raids,
      timesRaided: user.times_raided,
      spins: user.total_spins,
    },
    buildings: buildingStates(user.id, user.village),
    cards: getCards(user.id),
    claimedSets: getClaimedSets(user.id),
  };
}

export function toPublicUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    level: user.level,
    villageId: user.village,
    isBot: !!user.is_bot,
    shields: user.shields,
    coins: user.coins,
  };
}

/* ------------------------------------------------------------------ */
/*  Ereignis-Log                                                       */
/* ------------------------------------------------------------------ */

export function logEvent(opts: {
  userId: string;
  type: string;
  otherId?: string;
  otherName?: string;
  amount?: number;
  detail?: string;
}): void {
  db.prepare(
    `INSERT INTO events (user_id, type, other_id, other_name, amount, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    opts.userId,
    opts.type,
    opts.otherId ?? '',
    opts.otherName ?? '',
    Math.round(opts.amount ?? 0),
    opts.detail ?? '',
    now(),
  );
}

/** Naechste Insel freischalten, wenn die aktuelle fertig ausgebaut ist. */
export function advanceVillageIfComplete(user: UserRow): { advanced: boolean; levelUps: number } {
  if (villageProgress(user.id, user.village) < 1) return { advanced: false, levelUps: 0 };
  if (user.village >= MAX_VILLAGE) return { advanced: false, levelUps: 0 };
  user.village += 1;
  ensureBuildings(user.id, user.village);
  user.spins = Math.min(spinCapacity(user.level), user.spins + 30);
  user.shields = Math.min(BALANCE.maxShields, user.shields + 1);
  const levelUps = addXp(user, 600 * user.village);
  logEvent({
    userId: user.id,
    type: 'village',
    detail: `Insel ${getVillage(user.village).name} erreicht`,
  });
  return { advanced: true, levelUps };
}
