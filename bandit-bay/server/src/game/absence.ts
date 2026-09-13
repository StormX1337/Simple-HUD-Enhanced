import { db, now, type EventRow, type UserRow } from '../db.js';
import type { HistoryEntry } from '../types.js';
import { BALANCE, getVillage } from '../content/content.js';
import { getBuildings, logEvent, randInt, saveUser } from './core.js';
import { rollPetAbility } from './pets.js';

/** Ein Simulationsfenster: alle drei Stunden kann ein Bot vorbeischauen. */
const WINDOW_MS = 3 * 3_600_000;
/** Höchstens so viele Fenster werden nachgeholt (12 Stunden). */
const MAX_WINDOWS = 4;
/** Wahrscheinlichkeit, dass in einem Fenster etwas passiert. */
const EVENT_CHANCE = 0.45;
/** Anteil der Taler, den ein Bot-Raubzug höchstens mitnimmt. */
const RAID_SHARE = 0.08;
/** Erst ab diesem Level wird das Dorf überfallen. */
const MIN_LEVEL = 3;

function randomBot(excludeId: string): UserRow | undefined {
  return db
    .prepare<[string], UserRow>(
      'SELECT * FROM users WHERE is_bot = 1 AND id != ? ORDER BY RANDOM() LIMIT 1',
    )
    .get(excludeId);
}

/**
 * Simuliert, was während der Abwesenheit passiert ist: Bots greifen an
 * oder rauben. Schilde blocken Angriffe, Raubzüge kosten Taler.
 * Wird beim Laden des Spielstands aufgerufen.
 */
export function simulateAbsence(user: UserRow): void {
  if (user.is_bot) return;
  const ts = now();
  if (user.last_sim === 0) {
    user.last_sim = ts;
    saveUser(user);
    return;
  }
  const windows = Math.min(MAX_WINDOWS, Math.floor((ts - user.last_sim) / WINDOW_MS));
  if (windows <= 0) return;

  user.last_sim = ts;
  if (user.level < MIN_LEVEL) {
    saveUser(user);
    return;
  }

  let stolenTotal = 0;
  const stealCap = Math.round(user.coins * 0.2);

  for (let index = 0; index < windows; index++) {
    if (Math.random() > EVENT_CHANCE) continue;
    const bot = randomBot(user.id);
    if (!bot) break;

    if (Math.random() < 0.6) {
      // Begleiter-Fähigkeit: Kiki wehrt den Angriff ohne Schildverbrauch ab.
      if (rollPetAbility(user.id, 'guard')) {
        logEvent({
          userId: user.id,
          type: 'blocked',
          otherId: bot.id,
          otherName: bot.name,
          detail: 'Kiki hat Wache gehalten',
        });
        continue;
      }
      // Angriff auf ein Gebäude
      if (user.shields > 0) {
        user.shields -= 1;
        logEvent({
          userId: user.id,
          type: 'blocked',
          otherId: bot.id,
          otherName: bot.name,
          detail: 'Angriff vom Schild geblockt',
        });
        continue;
      }
      const village = getVillage(user.village);
      const targets = getBuildings(user.id, user.village).filter((row) => row.level > 0);
      if (targets.length === 0) continue;
      const hit = targets[randInt(0, targets.length - 1)];
      db.prepare('UPDATE buildings SET level = ? WHERE user_id = ? AND village = ? AND idx = ?').run(
        hit.level - 1,
        user.id,
        user.village,
        hit.idx,
      );
      logEvent({
        userId: user.id,
        type: 'attacked',
        otherId: bot.id,
        otherName: bot.name,
        detail: `${village.buildings[hit.idx]?.name ?? 'Gebäude'} beschädigt`,
      });
    } else {
      // Raubzug auf die Taler
      if (stolenTotal >= stealCap) continue;
      const loot = Math.min(
        Math.round(user.coins * RAID_SHARE),
        Math.max(0, stealCap - stolenTotal),
      );
      if (loot <= 0) continue;
      user.coins = Math.max(0, user.coins - loot);
      user.times_raided += 1;
      stolenTotal += loot;
      bot.coins += loot;
      saveUser(bot);
      logEvent({
        userId: user.id,
        type: 'raided',
        otherId: bot.id,
        otherName: bot.name,
        amount: loot,
        detail: 'Taler gestohlen',
      });
    }
  }

  if (user.shields > BALANCE.maxShields) user.shields = BALANCE.maxShields;
  saveUser(user);
}

/** Ereignisse, die der Spieler noch nicht gesehen hat. */
export function unseenNews(user: UserRow, limit = 12): HistoryEntry[] {
  const rows = db
    .prepare<[string, number, number], EventRow>(
      `SELECT * FROM events
       WHERE user_id = ? AND id > ? AND type IN ('attacked', 'raided', 'blocked', 'gifted')
       ORDER BY id DESC LIMIT ?`,
    )
    .all(user.id, user.last_seen_event, limit);
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

/** Merkt sich, dass alle bisherigen Ereignisse gesehen wurden. */
export function markNewsSeen(user: UserRow): void {
  const row = db
    .prepare<[string], { max_id: number | null }>(
      'SELECT MAX(id) as max_id FROM events WHERE user_id = ?',
    )
    .get(user.id);
  user.last_seen_event = row?.max_id ?? 0;
  saveUser(user);
}
