import { db, migrate } from './db.js';
import { BOT_NAMES, VILLAGES, BALANCE, getVillage } from './content/content.js';
import { createUser, ensureBuildings, randInt, saveUser } from './game/core.js';
import { drawCard, grantCard } from './game/collection.js';

/** Legt Mitspieler-Bots an, damit Angriffe und Raubzuege sofort moeglich sind. */
export function seedBots(): number {
  const existing = db
    .prepare<[], { count: number }>('SELECT COUNT(*) as count FROM users WHERE is_bot = 1')
    .get();
  if ((existing?.count ?? 0) >= BOT_NAMES.length) return 0;

  let created = 0;
  for (const bot of BOT_NAMES) {
    const taken = db.prepare('SELECT id FROM users WHERE lower(name) = lower(?)').get(bot.name);
    if (taken) continue;

    const level = randInt(2, 32);
    const villageId = Math.min(VILLAGES.length, 1 + Math.floor(level / 6));
    const user = createUser({
      name: bot.name,
      avatar: bot.avatar,
      isBot: true,
      level,
      village: villageId,
      coins: randInt(40_000, 900_000) * villageId,
      spins: randInt(10, 80),
    });
    user.shields = randInt(0, BALANCE.maxShields);
    user.total_attacks = randInt(0, 120);
    user.total_raids = randInt(0, 90);
    saveUser(user);

    // Vorherige Inseln gelten als fertig, die aktuelle wird teilweise ausgebaut.
    for (let v = 1; v < villageId; v++) {
      ensureBuildings(user.id, v);
      db.prepare('UPDATE buildings SET level = ? WHERE user_id = ? AND village = ?').run(
        BALANCE.maxBuildingLevel,
        user.id,
        v,
      );
    }
    ensureBuildings(user.id, villageId);
    getVillage(villageId).buildings.forEach((_, index) => {
      db.prepare(
        'UPDATE buildings SET level = ? WHERE user_id = ? AND village = ? AND idx = ?',
      ).run(randInt(0, BALANCE.maxBuildingLevel), user.id, villageId, index);
    });

    for (let i = 0; i < randInt(3, 12); i++) grantCard(user, drawCard(user));
    saveUser(user);
    created += 1;
  }
  return created;
}

const isDirectRun = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop() ?? '');
if (isDirectRun) {
  migrate();
  const created = seedBots();
  console.log(`Bots angelegt: ${created}`);
}
