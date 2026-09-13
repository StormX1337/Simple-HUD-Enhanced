import { db, dayKey, now, type UserRow } from '../db.js';
import {
  BALANCE,
  WHEEL,
  spinCapacity,
  wheelCoinBase,
  type WheelSegmentDef,
} from '../content/content.js';
import { addXp, logEvent, pickWeighted, saveUser } from './core.js';
import { grantRandomCard, type CardDrop } from './collection.js';
import { GameError } from './slot.js';

export interface WheelSegmentView {
  id: string;
  label: string;
  kind: WheelSegmentDef['kind'];
  color: string;
  /** Konkreter Wert für diesen Spieler (Taler bzw. Anzahl). */
  amount: number;
}

export interface WheelStatus {
  canSpin: boolean;
  secondsUntilNext: number;
  segments: WheelSegmentView[];
}

function segmentAmount(segment: WheelSegmentDef, user: UserRow): number {
  if (segment.kind === 'coins' || segment.kind === 'jackpot') {
    return Math.round((wheelCoinBase(user.level, user.village) * segment.value) / 10) * 10;
  }
  return segment.value;
}

function wheelRow(userId: string): { user_id: string; last_day: string; spins: number } {
  db.prepare('INSERT OR IGNORE INTO wheel (user_id, last_day, spins) VALUES (?, ?, 0)').run(
    userId,
    '',
  );
  return db
    .prepare<[string], { user_id: string; last_day: string; spins: number }>(
      'SELECT * FROM wheel WHERE user_id = ?',
    )
    .get(userId) as { user_id: string; last_day: string; spins: number };
}

function secondsUntilMidnight(): number {
  const ts = now();
  const date = new Date(ts);
  const midnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1);
  return Math.max(0, Math.ceil((midnight - ts) / 1000));
}

export function wheelStatus(user: UserRow): WheelStatus {
  const row = wheelRow(user.id);
  return {
    canSpin: row.last_day !== dayKey(),
    secondsUntilNext: secondsUntilMidnight(),
    segments: WHEEL.map((segment) => ({
      id: segment.id,
      label: segment.label,
      kind: segment.kind,
      color: segment.color,
      amount: segmentAmount(segment, user),
    })),
  };
}

export interface WheelResult {
  index: number;
  segment: WheelSegmentView;
  coins: number;
  spins: number;
  shields: number;
  card: CardDrop | null;
  levelUps: number;
}

/** Einmal täglich drehen – das Ergebnis bestimmt der Server. */
export function spinWheel(user: UserRow): WheelResult {
  const row = wheelRow(user.id);
  const today = dayKey();
  if (row.last_day === today) throw new GameError('Das Glücksrad gibt es einmal pro Tag');

  const segment = pickWeighted(WHEEL, (entry) => entry.weight);
  const index = WHEEL.indexOf(segment);
  const amount = segmentAmount(segment, user);

  let coins = 0;
  let spins = 0;
  let shields = 0;
  let card: CardDrop | null = null;

  switch (segment.kind) {
    case 'coins':
    case 'jackpot':
      coins = amount;
      user.coins += coins;
      break;
    case 'spins': {
      const before = user.spins;
      user.spins = Math.min(spinCapacity(user.level), user.spins + amount);
      spins = user.spins - before;
      // Sind die Drehungen voll, gibt es stattdessen Taler.
      if (spins === 0) {
        coins = Math.round(wheelCoinBase(user.level, user.village) * amount * 8);
        user.coins += coins;
      }
      break;
    }
    case 'shield':
      if (user.shields < BALANCE.maxShields) {
        user.shields += amount;
        shields = amount;
      } else {
        coins = Math.round(wheelCoinBase(user.level, user.village) * 60);
        user.coins += coins;
      }
      break;
    case 'card':
      card = grantRandomCard(user);
      break;
  }

  const levelUps = addXp(user, 120);
  db.prepare('UPDATE wheel SET last_day = ?, spins = spins + 1 WHERE user_id = ?').run(
    today,
    user.id,
  );
  saveUser(user);
  logEvent({ userId: user.id, type: 'wheel', amount: coins, detail: segment.label });

  return {
    index,
    segment: {
      id: segment.id,
      label: segment.label,
      kind: segment.kind,
      color: segment.color,
      amount,
    },
    coins,
    spins,
    shields,
    card,
    levelUps,
  };
}
