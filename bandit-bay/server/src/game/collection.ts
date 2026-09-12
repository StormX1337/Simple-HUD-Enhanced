import { db, now, type UserRow } from '../db.js';
import type { CardDef, Rarity } from '../types.js';
import {
  BALANCE,
  CARDS,
  CARD_SETS,
  CHESTS,
  RARITY_WEIGHTS,
  cardsOfSet,
  chestCost,
  duplicateValue,
  spinCapacity,
} from '../content/content.js';
import { addXp, logEvent, pickWeighted, saveUser } from './core.js';
import { trackQuest } from './progress.js';

export interface CardDrop {
  card: CardDef;
  isNew: boolean;
  coins: number;
}

/** Zufaellige Karte ziehen – bevorzugt Sets der bereits erreichten Inseln. */
export function drawCard(user: UserRow, minRarity: Rarity = 1): CardDef {
  const reachable = CARDS.filter((card) => {
    const set = CARD_SETS.find((s) => s.id === card.setId);
    return set ? set.villageId <= user.village + 1 : false;
  });
  const pool = (reachable.length > 0 ? reachable : CARDS).filter((c) => c.rarity >= minRarity);
  const finalPool = pool.length > 0 ? pool : CARDS;
  return pickWeighted(finalPool, (card) => RARITY_WEIGHTS[card.rarity]);
}

/** Karte gutschreiben. Duplikate werden in Taler umgewandelt. */
export function grantCard(user: UserRow, card: CardDef): CardDrop {
  const row = db
    .prepare<[string, string], { count: number }>(
      'SELECT count FROM cards WHERE user_id = ? AND card_id = ?',
    )
    .get(user.id, card.id);
  const isNew = !row || row.count === 0;
  db.prepare(
    `INSERT INTO cards (user_id, card_id, count) VALUES (?, ?, 1)
     ON CONFLICT(user_id, card_id) DO UPDATE SET count = count + 1`,
  ).run(user.id, card.id);

  let coins = 0;
  if (!isNew) {
    coins = duplicateValue(card.rarity, user.level);
    user.coins += coins;
  }
  trackQuest(user.id, 'cards', 1);
  return { card, isNew, coins };
}

export function grantRandomCard(user: UserRow, minRarity: Rarity = 1): CardDrop {
  return grantCard(user, drawCard(user, minRarity));
}

export interface ChestResult {
  ok: boolean;
  error?: string;
  cost: number;
  drops: CardDrop[];
}

export function openChest(user: UserRow, chestId: string): ChestResult {
  const chest = CHESTS.find((c) => c.id === chestId);
  if (!chest) return { ok: false, error: 'Unbekannte Truhe', cost: 0, drops: [] };
  const cost = chestCost(chest, user.level);
  if (user.coins < cost) return { ok: false, error: 'Nicht genug Taler', cost, drops: [] };

  user.coins -= cost;
  const drops: CardDrop[] = [];
  for (let i = 0; i < chest.cards; i++) {
    // Mindestens eine Karte erfuellt die Mindestseltenheit der Truhe.
    const minRarity: Rarity = i === 0 ? chest.minRarity : 1;
    drops.push(grantRandomCard(user, minRarity));
  }
  saveUser(user);
  logEvent({ userId: user.id, type: 'chest', amount: -cost, detail: chest.name });
  return { ok: true, cost, drops };
}

export interface SetClaimResult {
  ok: boolean;
  error?: string;
  coins: number;
  spins: number;
  xp: number;
  shields: number;
  levelUps: number;
}

export function claimSet(user: UserRow, setId: string): SetClaimResult {
  const set = CARD_SETS.find((s) => s.id === setId);
  if (!set) return { ok: false, error: 'Unbekanntes Set', coins: 0, spins: 0, xp: 0, shields: 0, levelUps: 0 };

  const already = db
    .prepare<[string, string], { set_id: string }>(
      'SELECT set_id FROM card_sets WHERE user_id = ? AND set_id = ?',
    )
    .get(user.id, setId);
  if (already)
    return { ok: false, error: 'Set bereits eingeloest', coins: 0, spins: 0, xp: 0, shields: 0, levelUps: 0 };

  const owned = db
    .prepare<[string], { card_id: string; count: number }>(
      'SELECT card_id, count FROM cards WHERE user_id = ?',
    )
    .all(user.id);
  const complete = cardsOfSet(setId).every(
    (card) => (owned.find((o) => o.card_id === card.id)?.count ?? 0) > 0,
  );
  if (!complete)
    return { ok: false, error: 'Set ist noch nicht vollstaendig', coins: 0, spins: 0, xp: 0, shields: 0, levelUps: 0 };

  db.prepare('INSERT INTO card_sets (user_id, set_id, claimed_at) VALUES (?, ?, ?)').run(
    user.id,
    setId,
    now(),
  );
  user.coins += set.reward.coins;
  user.spins = Math.min(spinCapacity(user.level), user.spins + set.reward.spins);
  user.shields = Math.min(BALANCE.maxShields, user.shields + (set.reward.shields ?? 0));
  const levelUps = addXp(user, set.reward.xp);
  saveUser(user);
  logEvent({ userId: user.id, type: 'set', amount: set.reward.coins, detail: set.name });
  return {
    ok: true,
    coins: set.reward.coins,
    spins: set.reward.spins,
    xp: set.reward.xp,
    shields: set.reward.shields ?? 0,
    levelUps,
  };
}
