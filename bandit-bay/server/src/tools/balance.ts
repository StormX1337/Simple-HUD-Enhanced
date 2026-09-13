/**
 * Balance-Simulation: spielt die echte Engine durch und zeigt, wie lange
 * eine Insel dauert. Start: npm run balance -w server
 *
 * Strategie des simulierten Spielers: immer drehen, Angriffe und Raubzüge
 * sofort ausführen, sobald genug Taler da sind das günstigste Gebäude
 * ausbauen.
 */
import { migrate } from '../db.js';
import { seedBots } from '../seed.js';
import { BALANCE, MAX_VILLAGE, getVillage } from '../content/content.js';
import { buildState, createUser, randInt, saveUser } from '../game/core.js';
import { spin } from '../game/slot.js';
import { upgradeBuilding } from '../game/village.js';
import { attack, getTargets, raid } from '../game/battle.js';

interface IslandStats {
  village: number;
  name: string;
  spins: number;
  /** Verbrauchte Drehungen inklusive Einsatzhöhe – die echte Ressource. */
  spinUnits: number;
  /** Am Automaten zurückgewonnene Drehungen. */
  spinsWon: number;
  coinsEarned: number;
  attacks: number;
  raids: number;
  levelStart: number;
  levelEnd: number;
}

function emptyStats(village: number, level: number): IslandStats {
  return {
    village,
    name: getVillage(village).name,
    spins: 0,
    spinUnits: 0,
    spinsWon: 0,
    coinsEarned: 0,
    attacks: 0,
    raids: 0,
    levelStart: level,
    levelEnd: level,
  };
}

function simulate(maxSpins = 80_000): IslandStats[] {
  migrate();
  seedBots();
  const player = createUser({ name: `Sim-${Date.now()}` });
  const stats: IslandStats[] = [];
  let current = emptyStats(player.village, player.level);

  for (let i = 0; i < maxSpins; i++) {
    if (player.spins < player.bet) {
      player.spins = BALANCE.spinCapacityBase;
      saveUser(player);
    }

    const coinsBefore = player.coins;
    const usedBet = player.bet;
    const result = spin(player, usedBet);
    current.spins += 1;
    current.spinUnits += usedBet;
    current.coinsEarned += Math.max(0, player.coins - coinsBefore);

    while (player.pending_attacks > 0) {
      const targets = getTargets(player);
      const target = targets[randInt(0, targets.length - 1)];
      const spot = target.buildings.find((building) => building.level > 0) ?? target.buildings[0];
      current.coinsEarned += attack(player, target.id, spot.index).loot;
      current.attacks += 1;
    }
    while (player.pending_raids > 0) {
      const targets = getTargets(player);
      const target = targets[randInt(0, targets.length - 1)];
      current.coinsEarned += raid(player, target.id, randInt(0, 3)).loot;
      current.raids += 1;
    }

    const state = buildState(player);
    const wantedBet = Math.min(10, state.maxBet);
    if (player.bet !== wantedBet) {
      player.bet = wantedBet;
      saveUser(player);
    }

    let upgraded = true;
    while (upgraded) {
      upgraded = false;
      const open = buildState(player)
        .buildings.filter((building) => building.level < building.maxLevel)
        .sort((a, b) => a.cost - b.cost)[0];
      if (open && player.coins >= open.cost) {
        const villageBefore = player.village;
        upgradeBuilding(player, player.village, open.index);
        upgraded = true;
        if (player.village !== villageBefore) {
          current.levelEnd = player.level;
          stats.push(current);
          current = emptyStats(player.village, player.level);
        }
      }
    }

    if (result.outcome === 'spins') current.spinsWon += result.amount;
    if (result.levelUps > 0) current.levelEnd = player.level;
    if (player.village === MAX_VILLAGE && buildState(player).villageProgress >= 1) break;
  }

  current.levelEnd = player.level;
  stats.push(current);
  return stats;
}

const minutesPerSpin = BALANCE.spinRegenSeconds / 60;
const stats = simulate();

console.log('\nBandit Bay – Balance-Simulation');
console.log('(ein Spieler, Einsatz bis x10, Angriffe und Raubzüge werden genutzt)\n');
console.log('Insel              Zuege  Drehungen    Taler verdient   Angr.  Raub  Level');
console.log('-'.repeat(78));
let totalSpins = 0;
let totalUnits = 0;
let totalWon = 0;
for (const entry of stats) {
  totalSpins += entry.spins;
  totalUnits += entry.spinUnits;
  totalWon += entry.spinsWon;
  console.log(
    `${entry.village}. ${entry.name.padEnd(14)} ${String(entry.spins).padStart(6)} ` +
      `${String(entry.spinUnits).padStart(9)}   ` +
      `${entry.coinsEarned.toLocaleString('de-DE').padStart(15)}   ` +
      `${String(entry.attacks).padStart(5)} ${String(entry.raids).padStart(5)}  ` +
      `${entry.levelStart}→${entry.levelEnd}`,
  );
}
console.log('-'.repeat(78));
const hours = (totalUnits * minutesPerSpin) / 60;
const netUnits = Math.max(1, totalUnits - totalWon);
console.log(
  `Zurückgewonnen: ${totalWon} Drehungen am Automaten (netto ${netUnits} nötig, das sind ` +
    `${((netUnits * minutesPerSpin) / 60).toFixed(1)} Stunden Wartezeit).`,
);
console.log(
  `Gesamt: ${totalSpins} Züge, ${totalUnits} Drehungen verbraucht · reine Regenerationszeit ` +
    `etwa ${hours.toFixed(1)} Stunden (1 Drehung / ${BALANCE.spinRegenSeconds} s, ohne ` +
    `gewonnene Extra-Drehungen).\n`,
);
