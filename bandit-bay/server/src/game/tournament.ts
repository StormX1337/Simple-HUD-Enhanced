import { db, now, type UserRow } from '../db.js';
import {
  TOURNAMENT,
  TOURNAMENT_PRIZES,
  spinCapacity,
  tournamentCycle,
  tournamentCycleEnd,
  tournamentPrizeFor,
  type TournamentPrize,
} from '../content/content.js';
import { logEvent, randInt, saveUser } from './core.js';
import { GameError } from './slot.js';

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

export interface TournamentReward {
  available: boolean;
  rank: number;
  label: string;
  coins: number;
  spins: number;
  wildcards: number;
}

export interface TournamentState {
  name: string;
  cycle: number;
  endsInSeconds: number;
  myPoints: number;
  myRank: number;
  entries: TournamentEntry[];
  prizes: TournamentPrize[];
  reward: TournamentReward | null;
}

/** Punkte gutschreiben (Angriffe und Raubzüge). */
export function addTournamentPoints(userId: string, points: number): void {
  if (points <= 0) return;
  const cycle = tournamentCycle();
  db.prepare(
    `INSERT INTO tournament (user_id, cycle, points, claimed) VALUES (?, ?, ?, 0)
     ON CONFLICT(user_id, cycle) DO UPDATE SET points = points + excluded.points`,
  ).run(userId, cycle, points);
}

/** Bots bekommen einmal pro Zyklus eine plausible Punktzahl. */
function ensureBotScores(cycle: number): void {
  const bots = db
    .prepare<[number], UserRow>(
      `SELECT * FROM users WHERE is_bot = 1
       AND id NOT IN (SELECT user_id FROM tournament WHERE cycle = ?)`,
    )
    .all(cycle);
  if (bots.length === 0) return;
  const insert = db.prepare(
    'INSERT OR IGNORE INTO tournament (user_id, cycle, points, claimed) VALUES (?, ?, ?, 0)',
  );
  const tx = db.transaction(() => {
    for (const bot of bots) {
      insert.run(bot.id, cycle, randInt(20, 60) * Math.max(1, Math.round(bot.level / 2)));
    }
  });
  tx();
}

function entries(cycle: number, meId: string, limit = 25): TournamentEntry[] {
  const rows = db
    .prepare<[number, number], { user_id: string; points: number; name: string; avatar: string; level: number; is_bot: number }>(
      `SELECT t.user_id, t.points, u.name, u.avatar, u.level, u.is_bot
       FROM tournament t JOIN users u ON u.id = t.user_id
       WHERE t.cycle = ? ORDER BY t.points DESC, u.level DESC LIMIT ?`,
    )
    .all(cycle, limit);
  return rows.map((row, index) => ({
    rank: index + 1,
    id: row.user_id,
    name: row.name,
    avatar: row.avatar,
    level: row.level,
    points: row.points,
    isBot: !!row.is_bot,
    isMe: row.user_id === meId,
  }));
}

function rankOf(cycle: number, userId: string): { rank: number; points: number } {
  const row = db
    .prepare<[string, number], { points: number }>(
      'SELECT points FROM tournament WHERE user_id = ? AND cycle = ?',
    )
    .get(userId, cycle);
  const points = row?.points ?? 0;
  const better = db
    .prepare<[number, number], { count: number }>(
      'SELECT COUNT(*) as count FROM tournament WHERE cycle = ? AND points > ?',
    )
    .get(cycle, points);
  return { rank: (better?.count ?? 0) + 1, points };
}

/** Offene Belohnung aus dem letzten abgeschlossenen Zyklus. */
function pendingReward(user: UserRow, cycle: number): TournamentReward | null {
  const previous = cycle - 1;
  const row = db
    .prepare<[string, number], { points: number; claimed: number }>(
      'SELECT points, claimed FROM tournament WHERE user_id = ? AND cycle = ?',
    )
    .get(user.id, previous);
  if (!row || row.claimed || row.points <= 0) return null;
  ensureBotScores(previous);
  const { rank } = rankOf(previous, user.id);
  const prize = tournamentPrizeFor(rank);
  if (!prize) return null;
  return {
    available: true,
    rank,
    label: prize.label,
    coins: prize.coins,
    spins: prize.spins,
    wildcards: prize.wildcards ?? 0,
  };
}

export function tournamentState(user: UserRow): TournamentState {
  const cycle = tournamentCycle();
  ensureBotScores(cycle);
  const mine = rankOf(cycle, user.id);
  return {
    name: TOURNAMENT.name,
    cycle,
    endsInSeconds: Math.max(0, Math.ceil((tournamentCycleEnd(cycle) - now()) / 1000)),
    myPoints: mine.points,
    myRank: mine.rank,
    entries: entries(cycle, user.id),
    prizes: TOURNAMENT_PRIZES,
    reward: pendingReward(user, cycle),
  };
}

export interface TournamentClaim {
  rank: number;
  coins: number;
  spins: number;
  wildcards: number;
}

export function claimTournament(user: UserRow): TournamentClaim {
  const cycle = tournamentCycle();
  const reward = pendingReward(user, cycle);
  if (!reward) throw new GameError('Keine Turnierbelohnung offen');

  db.prepare('UPDATE tournament SET claimed = 1 WHERE user_id = ? AND cycle = ?').run(
    user.id,
    cycle - 1,
  );
  user.coins += reward.coins;
  user.spins = Math.min(spinCapacity(user.level), user.spins + reward.spins);
  user.wildcards += reward.wildcards;
  saveUser(user);
  logEvent({
    userId: user.id,
    type: 'tournament',
    amount: reward.coins,
    detail: `${TOURNAMENT.name}: ${reward.label}`,
  });
  return {
    rank: reward.rank,
    coins: reward.coins,
    spins: reward.spins,
    wildcards: reward.wildcards,
  };
}
