import { db, type UserRow } from '../db.js';
import type { AttackResult, RaidResult, RaidSpot } from '../types.js';
import { BALANCE, coinValue, getVillage } from '../content/content.js';
import {
  addXp,
  buildState,
  getBuildings,
  getUserById,
  logEvent,
  randInt,
  refreshBot,
  saveUser,
} from './core.js';
import { trackQuest } from './progress.js';
import { GameError } from './slot.js';

export interface TargetInfo {
  id: string;
  name: string;
  avatar: string;
  level: number;
  villageId: number;
  villageName: string;
  isBot: boolean;
  shields: number;
  buildings: { index: number; name: string; kind: string; level: number }[];
  estimatedLoot: number;
}

function targetInfo(target: UserRow, attacker: UserRow): TargetInfo {
  const village = getVillage(target.village);
  const rows = getBuildings(target.id, target.village);
  return {
    id: target.id,
    name: target.name,
    avatar: target.avatar,
    level: target.level,
    villageId: target.village,
    villageName: village.name,
    isBot: !!target.is_bot,
    shields: target.shields,
    buildings: rows.map((row) => ({
      index: row.idx,
      name: village.buildings[row.idx]?.name ?? `Gebaeude ${row.idx + 1}`,
      kind: village.buildings[row.idx]?.kind ?? 'hut',
      level: row.level,
    })),
    estimatedLoot: Math.round(
      Math.max(
        coinValue(attacker.level, attacker.village) * attacker.bet * 5,
        target.coins * BALANCE.raidLootShare,
      ),
    ),
  };
}

/** Zufaellige Ziele fuer Angriff/Raubzug. */
export function getTargets(user: UserRow, count = 4): TargetInfo[] {
  const rows = db
    .prepare<[string, number, number], UserRow>(
      `SELECT * FROM users
       WHERE id != ? AND level BETWEEN ? AND ?
       ORDER BY RANDOM() LIMIT 12`,
    )
    .all(user.id, Math.max(1, user.level - 12), user.level + 12);
  let pool = rows;
  if (pool.length < count) {
    pool = db
      .prepare<[string], UserRow>('SELECT * FROM users WHERE id != ? ORDER BY RANDOM() LIMIT 12')
      .all(user.id);
  }
  return pool.slice(0, count).map((row) => targetInfo(refreshBot(row), user));
}

export function getTarget(user: UserRow, targetId: string): TargetInfo {
  const target = getUserById(targetId);
  if (!target || target.id === user.id) throw new GameError('Ziel nicht gefunden', 404);
  return targetInfo(refreshBot(target), user);
}

/* ------------------------------------------------------------------ */
/*  Angriff                                                            */
/* ------------------------------------------------------------------ */

export function attack(user: UserRow, targetId: string, spotIndex: number): AttackResult {
  if (user.pending_attacks <= 0) throw new GameError('Du hast keinen Angriff uebrig');
  const target = getUserById(targetId);
  if (!target || target.id === user.id) throw new GameError('Ziel nicht gefunden', 404);
  refreshBot(target);

  const village = getVillage(target.village);
  if (spotIndex < 0 || spotIndex >= village.buildings.length)
    throw new GameError('Ungueltiges Ziel-Gebaeude');

  user.pending_attacks -= 1;
  user.total_attacks += 1;

  const base = coinValue(user.level, user.village);
  const buildingName = village.buildings[spotIndex].name;
  let blocked = false;
  let destroyed = false;
  let loot = 0;
  let message = '';

  if (target.shields > 0) {
    blocked = true;
    target.shields -= 1;
    loot = Math.round(base * user.bet * 3);
    message = `${target.name} hat den Angriff mit einem Schild geblockt.`;
    logEvent({
      userId: target.id,
      type: 'blocked',
      otherId: user.id,
      otherName: user.name,
      amount: 0,
      detail: `Angriff auf ${buildingName} geblockt`,
    });
  } else {
    const row = db
      .prepare<[string, number, number], { level: number }>(
        'SELECT level FROM buildings WHERE user_id = ? AND village = ? AND idx = ?',
      )
      .get(target.id, target.village, spotIndex);
    const level = row?.level ?? 0;
    if (level > 0) {
      destroyed = true;
      db.prepare(
        'UPDATE buildings SET level = ? WHERE user_id = ? AND village = ? AND idx = ?',
      ).run(level - 1, target.id, target.village, spotIndex);
      loot = Math.round(base * user.bet * (6 + randInt(0, 4)) + target.coins * BALANCE.attackLootShare * 0.2);
      message = `Volltreffer! ${buildingName} von ${target.name} ist beschaedigt.`;
    } else {
      loot = Math.round(base * user.bet * 2);
      message = `Leeres Grundstueck erwischt – nur ein paar Taler bei ${target.name}.`;
    }
    logEvent({
      userId: target.id,
      type: 'attacked',
      otherId: user.id,
      otherName: user.name,
      amount: loot,
      detail: destroyed ? `${buildingName} beschaedigt` : `Fehlschlag auf ${buildingName}`,
    });
  }

  user.coins += loot;
  trackQuest(user.id, 'attack', 1);
  trackQuest(user.id, 'coins', loot);
  const levelUps = addXp(user, 40 + user.bet * 0.5);
  saveUser(user);
  saveUser(target);
  logEvent({
    userId: user.id,
    type: 'attack',
    otherId: target.id,
    otherName: target.name,
    amount: loot,
    detail: blocked ? 'Geblockt' : destroyed ? `${buildingName} getroffen` : 'Daneben',
  });

  return {
    blocked,
    destroyed,
    spotIndex,
    loot,
    targetName: target.name,
    targetBuildingName: buildingName,
    message,
    levelUps,
    state: buildState(user),
  };
}

/* ------------------------------------------------------------------ */
/*  Raubzug                                                            */
/* ------------------------------------------------------------------ */

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function raid(user: UserRow, targetId: string, spotIndex: number): RaidResult {
  if (user.pending_raids <= 0) throw new GameError('Du hast keinen Raubzug uebrig');
  if (spotIndex < 0 || spotIndex > 3) throw new GameError('Ungueltige Grabstelle');
  const target = getUserById(targetId);
  if (!target || target.id === user.id) throw new GameError('Ziel nicht gefunden', 404);
  refreshBot(target);

  user.pending_raids -= 1;
  user.total_raids += 1;

  const base = coinValue(user.level, user.village);
  const minLoot = Math.round(base * user.bet * 5);
  const jackpot = Math.max(minLoot * 3, Math.round(target.coins * BALANCE.raidJackpotShare));
  const normal = Math.max(minLoot, Math.round(target.coins * BALANCE.raidLootShare));

  const kinds: RaidSpot['kind'][] = shuffle(['jackpot', 'loot', 'loot', 'empty']);
  const spots: RaidSpot[] = kinds.map((kind, index) => ({
    index,
    kind,
    amount: kind === 'jackpot' ? jackpot : kind === 'loot' ? normal : 0,
  }));

  const picked = spots[spotIndex];
  const loot = picked.amount;
  user.coins += loot;
  target.coins = Math.max(0, target.coins - Math.min(loot, target.coins));
  target.times_raided += 1;

  trackQuest(user.id, 'raid', 1);
  trackQuest(user.id, 'coins', loot);
  const levelUps = addXp(user, 55 + user.bet * 0.5);
  saveUser(user);
  saveUser(target);

  const message =
    picked.kind === 'jackpot'
      ? `Jackpot! Du hast den Talerhort von ${target.name} gefunden.`
      : picked.kind === 'loot'
        ? `Beute gemacht bei ${target.name}!`
        : `Leeres Loch – ${target.name} hatte Glueck.`;

  logEvent({
    userId: user.id,
    type: 'raid',
    otherId: target.id,
    otherName: target.name,
    amount: loot,
    detail: picked.kind,
  });
  logEvent({
    userId: target.id,
    type: 'raided',
    otherId: user.id,
    otherName: user.name,
    amount: loot,
    detail: picked.kind === 'empty' ? 'Nichts gefunden' : 'Taler gestohlen',
  });

  return {
    spots,
    pickedIndex: spotIndex,
    loot,
    targetName: target.name,
    message,
    levelUps,
    state: buildState(user),
  };
}
