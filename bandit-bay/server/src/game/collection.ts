import { db, dayKey, now, type UserRow } from '../db.js';
import type { CardDef, Rarity } from '../types.js';
import {
  BALANCE,
  CARDS,
  cardById,
  CARD_SETS,
  CHESTS,
  RARITY_WEIGHTS,
  cardsOfSet,
  chestCost,
  duplicateValue,
  spinCapacity,
} from '../content/content.js';
import { addXp, getUserById, logEvent, pickWeighted, saveUser } from './core.js';
import { hasPetAbility, petBonus } from './pets.js';
import { GameError } from './slot.js';
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
    coins = Math.round(duplicateValue(card.rarity, user.level) * petBonus(user.id, 'cards'));
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

/** Truhenpreis inklusive Begleiter-Rabatt (Otto). */
export function effectiveChestCost(user: UserRow, chestId: string): number {
  const chest = CHESTS.find((c) => c.id === chestId);
  if (!chest) return 0;
  const base = chestCost(chest, user.level);
  return hasPetAbility(user.id, 'bargain') ? Math.round((base * 0.75) / 100) * 100 : base;
}

export function openChest(user: UserRow, chestId: string): ChestResult {
  const chest = CHESTS.find((c) => c.id === chestId);
  if (!chest) return { ok: false, error: 'Unbekannte Truhe', cost: 0, drops: [] };
  const cost = effectiveChestCost(user, chest.id);
  if (user.coins < cost) return { ok: false, error: 'Nicht genug Taler', cost, drops: [] };

  user.coins -= cost;
  const drops: CardDrop[] = [];
  for (let i = 0; i < chest.cards; i++) {
    // Mindestens eine Karte erfüllt die Mindestseltenheit der Truhe.
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
    return { ok: false, error: 'Set bereits eingelöst', coins: 0, spins: 0, xp: 0, shields: 0, levelUps: 0 };

  const owned = db
    .prepare<[string], { card_id: string; count: number }>(
      'SELECT card_id, count FROM cards WHERE user_id = ?',
    )
    .all(user.id);
  const complete = cardsOfSet(setId).every(
    (card) => (owned.find((o) => o.card_id === card.id)?.count ?? 0) > 0,
  );
  if (!complete)
    return { ok: false, error: 'Set ist noch nicht vollständig', coins: 0, spins: 0, xp: 0, shields: 0, levelUps: 0 };

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

/* ------------------------------------------------------------------ */
/*  Karten verschenken                                                 */
/* ------------------------------------------------------------------ */

/** So viele Karten darf man pro Tag verschenken. */
export const GIFTS_PER_DAY = 5;

export interface GiftStatus {
  sentToday: number;
  limit: number;
  left: number;
}

export function giftStatus(userId: string): GiftStatus {
  const row = db
    .prepare<[string, string], { count: number }>(
      'SELECT count FROM card_gifts WHERE user_id = ? AND day = ?',
    )
    .get(userId, dayKey());
  const sent = row?.count ?? 0;
  return { sentToday: sent, limit: GIFTS_PER_DAY, left: Math.max(0, GIFTS_PER_DAY - sent) };
}

export interface GiftResult {
  card: CardDef;
  friendName: string;
  left: number;
}

/** Eine doppelte Karte an einen Freund verschenken. */
export function giftCard(user: UserRow, friendId: string, cardId: string): GiftResult {
  const card = cardById(cardId);
  if (!card) throw new GameError('Unbekannte Karte', 404);

  const isFriend = db
    .prepare('SELECT friend_id FROM friends WHERE user_id = ? AND friend_id = ?')
    .get(user.id, friendId);
  if (!isFriend) throw new GameError('Das ist keiner deiner Freunde');

  const friend = getUserById(friendId);
  if (!friend) throw new GameError('Freund nicht gefunden', 404);

  const status = giftStatus(user.id);
  if (status.left <= 0) throw new GameError(`Heute sind ${GIFTS_PER_DAY} Karten verschenkt`);

  const owned = db
    .prepare<[string, string], { count: number }>(
      'SELECT count FROM cards WHERE user_id = ? AND card_id = ?',
    )
    .get(user.id, cardId);
  if (!owned || owned.count < 2)
    throw new GameError('Du kannst nur doppelte Karten verschenken');

  const tx = db.transaction(() => {
    db.prepare('UPDATE cards SET count = count - 1 WHERE user_id = ? AND card_id = ?').run(
      user.id,
      cardId,
    );
    db.prepare(
      `INSERT INTO card_gifts (user_id, day, count) VALUES (?, ?, 1)
       ON CONFLICT(user_id, day) DO UPDATE SET count = count + 1`,
    ).run(user.id, dayKey());
  });
  tx();

  grantCard(friend, card);
  saveUser(friend);

  logEvent({
    userId: user.id,
    type: 'gift',
    otherId: friend.id,
    otherName: friend.name,
    detail: `${card.name} an ${friend.name}`,
  });
  logEvent({
    userId: friend.id,
    type: 'gifted',
    otherId: user.id,
    otherName: user.name,
    detail: `${card.name} geschenkt`,
  });

  return { card, friendName: friend.name, left: giftStatus(user.id).left };
}
