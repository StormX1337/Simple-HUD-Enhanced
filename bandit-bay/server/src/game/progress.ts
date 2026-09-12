import { db, dayKey, now, type EventRow, type QuestRow, type UserRow } from '../db.js';
import type {
  DailyState,
  HistoryEntry,
  LeaderboardEntry,
  QuestState,
  QuestType,
} from '../types.js';
import { BALANCE, DAILY_LADDER, QUESTS, spinCapacity } from '../content/content.js';
import { addXp, logEvent, saveUser } from './core.js';

/* ------------------------------------------------------------------ */
/*  Tagesquests                                                        */
/* ------------------------------------------------------------------ */

export function ensureQuests(userId: string, day: string = dayKey()): void {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO quests (user_id, day, quest_id, progress, claimed) VALUES (?, ?, ?, 0, 0)',
  );
  const tx = db.transaction(() => {
    for (const quest of QUESTS) insert.run(userId, day, quest.id);
  });
  tx();
}

/** Fortschritt für alle Quests eines Typs erhoehen. */
export function trackQuest(userId: string, type: QuestType, amount = 1): void {
  if (amount <= 0) return;
  const day = dayKey();
  ensureQuests(userId, day);
  const update = db.prepare(
    'UPDATE quests SET progress = min(progress + ?, ?) WHERE user_id = ? AND day = ? AND quest_id = ?',
  );
  for (const quest of QUESTS) {
    if (quest.type !== type) continue;
    update.run(amount, quest.target, userId, day, quest.id);
  }
}

export function questStates(userId: string): QuestState[] {
  const day = dayKey();
  ensureQuests(userId, day);
  const rows = db
    .prepare<[string, string], QuestRow>('SELECT * FROM quests WHERE user_id = ? AND day = ?')
    .all(userId, day);
  return QUESTS.map((quest) => {
    const row = rows.find((r) => r.quest_id === quest.id);
    return {
      id: quest.id,
      name: quest.name,
      description: quest.description,
      target: quest.target,
      progress: Math.min(quest.target, row?.progress ?? 0),
      claimed: !!row?.claimed,
      reward: quest.reward,
    };
  });
}

export interface ClaimResult {
  ok: boolean;
  error?: string;
  coins: number;
  spins: number;
  xp: number;
  shields: number;
  levelUps: number;
  cards: number;
}

export function claimQuest(user: UserRow, questId: string): ClaimResult {
  const quest = QUESTS.find((q) => q.id === questId);
  if (!quest) return { ok: false, error: 'Unbekannte Quest', coins: 0, spins: 0, xp: 0, shields: 0, levelUps: 0, cards: 0 };
  const day = dayKey();
  ensureQuests(user.id, day);
  const row = db
    .prepare<[string, string, string], QuestRow>(
      'SELECT * FROM quests WHERE user_id = ? AND day = ? AND quest_id = ?',
    )
    .get(user.id, day, questId);
  if (!row) return { ok: false, error: 'Quest nicht gefunden', coins: 0, spins: 0, xp: 0, shields: 0, levelUps: 0, cards: 0 };
  if (row.claimed) return { ok: false, error: 'Bereits abgeholt', coins: 0, spins: 0, xp: 0, shields: 0, levelUps: 0, cards: 0 };
  if (row.progress < quest.target)
    return { ok: false, error: 'Quest noch nicht erfüllt', coins: 0, spins: 0, xp: 0, shields: 0, levelUps: 0, cards: 0 };

  db.prepare('UPDATE quests SET claimed = 1 WHERE user_id = ? AND day = ? AND quest_id = ?').run(
    user.id,
    day,
    questId,
  );
  user.coins += quest.reward.coins;
  user.spins = Math.min(spinCapacity(user.level), user.spins + quest.reward.spins);
  const levelUps = addXp(user, quest.reward.xp);
  saveUser(user);
  logEvent({ userId: user.id, type: 'quest', amount: quest.reward.coins, detail: quest.name });
  return {
    ok: true,
    coins: quest.reward.coins,
    spins: quest.reward.spins,
    xp: quest.reward.xp,
    shields: 0,
    levelUps,
    cards: 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Tagesbelohnung                                                     */
/* ------------------------------------------------------------------ */

interface DailyRow {
  user_id: string;
  streak: number;
  last_day: string;
}

function dailyRow(userId: string): DailyRow {
  db.prepare('INSERT OR IGNORE INTO daily (user_id, streak, last_day) VALUES (?, 0, ?)').run(
    userId,
    '',
  );
  return db
    .prepare<[string], DailyRow>('SELECT * FROM daily WHERE user_id = ?')
    .get(userId) as DailyRow;
}

function yesterdayKey(): string {
  return dayKey(now() - 24 * 3600 * 1000);
}

export function dailyState(userId: string): DailyState {
  const row = dailyRow(userId);
  const today = dayKey();
  const canClaim = row.last_day !== today;
  const continues = row.last_day === yesterdayKey();
  const streak = canClaim ? (continues ? row.streak : 0) : row.streak;
  const nextDay = canClaim ? (streak % DAILY_LADDER.length) + 1 : ((streak - 1) % DAILY_LADDER.length) + 1;
  return { streak, canClaim, nextDay, ladder: DAILY_LADDER };
}

export function claimDaily(user: UserRow): ClaimResult {
  const row = dailyRow(user.id);
  const today = dayKey();
  if (row.last_day === today)
    return { ok: false, error: 'Heute schon abgeholt', coins: 0, spins: 0, xp: 0, shields: 0, levelUps: 0, cards: 0 };

  const continues = row.last_day === yesterdayKey();
  const streak = continues ? row.streak + 1 : 1;
  const reward = DAILY_LADDER[(streak - 1) % DAILY_LADDER.length];

  const coins = Math.round(reward.coins * (1 + (user.level - 1) * 0.25));
  user.coins += coins;
  user.spins = Math.min(spinCapacity(user.level), user.spins + reward.spins);
  user.shields = Math.min(BALANCE.maxShields, user.shields + reward.shields);
  const levelUps = addXp(user, 150 * reward.day);
  saveUser(user);
  db.prepare('UPDATE daily SET streak = ?, last_day = ? WHERE user_id = ?').run(
    streak,
    today,
    user.id,
  );
  logEvent({ userId: user.id, type: 'daily', amount: coins, detail: `Tag ${reward.day}` });
  return {
    ok: true,
    coins,
    spins: reward.spins,
    xp: 150 * reward.day,
    shields: reward.shields,
    levelUps,
    cards: reward.cards,
  };
}

/* ------------------------------------------------------------------ */
/*  Rangliste & Verlauf                                                */
/* ------------------------------------------------------------------ */

export function leaderboard(meId: string, limit = 25): LeaderboardEntry[] {
  const rows = db
    .prepare<[number], UserRow>(
      `SELECT * FROM users ORDER BY level DESC, village DESC, coins DESC LIMIT ?`,
    )
    .all(limit);
  return rows.map((row, index) => ({
    rank: index + 1,
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    level: row.level,
    villageId: row.village,
    coins: row.coins,
    isBot: !!row.is_bot,
    isMe: row.id === meId,
  }));
}

export function history(userId: string, limit = 30): HistoryEntry[] {
  const rows = db
    .prepare<[string, number], EventRow>(
      'SELECT * FROM events WHERE user_id = ? ORDER BY id DESC LIMIT ?',
    )
    .all(userId, limit);
  return rows.map((row) => ({
    id: row.id,
    type: row.type as HistoryEntry['type'],
    otherName: row.other_name,
    otherId: row.other_id,
    amount: row.amount,
    detail: row.detail,
    createdAt: row.created_at,
  }));
}
