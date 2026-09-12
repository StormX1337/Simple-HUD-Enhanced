import { db, type UserRow } from '../db.js';
import { BALANCE, upgradeCost } from '../content/content.js';
import { addXp, advanceVillageIfComplete, logEvent, saveUser } from './core.js';
import { trackQuest } from './progress.js';
import { GameError } from './slot.js';

export interface UpgradeResult {
  cost: number;
  index: number;
  newLevel: number;
  levelUps: number;
  villageComplete: boolean;
  newVillageId: number;
}

/** Gebäude ausbauen – Kosten und Grenzen werden serverseitig geprueft. */
export function upgradeBuilding(user: UserRow, villageId: number, index: number): UpgradeResult {
  if (villageId !== user.village) throw new GameError('Diese Insel ist gerade nicht aktiv');
  const row = db
    .prepare<[string, number, number], { level: number }>(
      'SELECT level FROM buildings WHERE user_id = ? AND village = ? AND idx = ?',
    )
    .get(user.id, villageId, index);
  if (!row) throw new GameError('Gebäude nicht gefunden', 404);
  if (row.level >= BALANCE.maxBuildingLevel) throw new GameError('Gebäude ist bereits fertig');

  const cost = upgradeCost(villageId, index, row.level);
  if (user.coins < cost) throw new GameError('Nicht genug Taler');

  user.coins -= cost;
  const newLevel = row.level + 1;
  db.prepare('UPDATE buildings SET level = ? WHERE user_id = ? AND village = ? AND idx = ?').run(
    newLevel,
    user.id,
    villageId,
    index,
  );
  let levelUps: number = addXp(user, Math.max(25, Math.round(cost / 120)));
  trackQuest(user.id, 'upgrade', 1);
  logEvent({
    userId: user.id,
    type: 'upgrade',
    amount: -cost,
    detail: `Ausbau auf Stufe ${newLevel}`,
  });

  const advance = advanceVillageIfComplete(user);
  levelUps += advance.levelUps;
  saveUser(user);

  return {
    cost,
    index,
    newLevel,
    levelUps,
    villageComplete: advance.advanced,
    newVillageId: user.village,
  };
}
