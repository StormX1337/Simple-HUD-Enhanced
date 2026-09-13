import { db, now, type UserRow } from '../db.js';
import {
  DECORATIONS,
  DECO_SLOTS,
  decoById,
  decoCost,
  type DecoArt,
} from '../content/content.js';
import { logEvent, saveUser } from './core.js';
import { GameError } from './slot.js';

export interface DecoOffer {
  id: string;
  name: string;
  art: DecoArt;
  color: string;
  cost: number;
}

export interface PlacedDeco {
  slot: number;
  id: string;
  name: string;
  art: DecoArt;
  color: string;
}

export interface DecoState {
  villageId: number;
  slots: number;
  offers: DecoOffer[];
  placed: PlacedDeco[];
}

/** Gekaufte Deko einer Insel. */
export function placedDecorations(userId: string, villageId: number): PlacedDeco[] {
  return db
    .prepare<[string, number], { slot: number; deco_id: string }>(
      'SELECT slot, deco_id FROM decorations WHERE user_id = ? AND village = ? ORDER BY slot',
    )
    .all(userId, villageId)
    .flatMap((row) => {
      const deco = decoById(row.deco_id);
      return deco
        ? [{ slot: row.slot, id: deco.id, name: deco.name, art: deco.art, color: deco.color }]
        : [];
    });
}

export function decoState(user: UserRow): DecoState {
  return {
    villageId: user.village,
    slots: DECO_SLOTS,
    offers: DECORATIONS.map((deco) => ({
      id: deco.id,
      name: deco.name,
      art: deco.art,
      color: deco.color,
      cost: decoCost(deco, user.village),
    })),
    placed: placedDecorations(user.id, user.village),
  };
}

export interface DecoPurchase {
  slot: number;
  deco: PlacedDeco;
  cost: number;
}

/** Deko kaufen und auf einen Platz stellen (ersetzt vorhandene Deko). */
export function buyDecoration(user: UserRow, slot: number, decoId: string): DecoPurchase {
  if (!Number.isInteger(slot) || slot < 0 || slot >= DECO_SLOTS)
    throw new GameError('Ungültiger Deko-Platz');
  const deco = decoById(decoId);
  if (!deco) throw new GameError('Unbekannte Dekoration', 404);

  const existing = db
    .prepare<[string, number, number], { deco_id: string }>(
      'SELECT deco_id FROM decorations WHERE user_id = ? AND village = ? AND slot = ?',
    )
    .get(user.id, user.village, slot);
  if (existing?.deco_id === decoId) throw new GameError('Steht hier schon');

  const cost = decoCost(deco, user.village);
  if (user.coins < cost) throw new GameError('Nicht genug Taler');

  user.coins -= cost;
  saveUser(user);
  db.prepare(
    `INSERT INTO decorations (user_id, village, slot, deco_id, created_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, village, slot) DO UPDATE SET deco_id = excluded.deco_id,
       created_at = excluded.created_at`,
  ).run(user.id, user.village, slot, decoId, now());
  logEvent({ userId: user.id, type: 'deco', amount: -cost, detail: deco.name });

  return {
    slot,
    cost,
    deco: { slot, id: deco.id, name: deco.name, art: deco.art, color: deco.color },
  };
}

/** Deko wieder entfernen (ohne Rückerstattung). */
export function removeDecoration(user: UserRow, slot: number): void {
  db.prepare('DELETE FROM decorations WHERE user_id = ? AND village = ? AND slot = ?').run(
    user.id,
    user.village,
    slot,
  );
}
