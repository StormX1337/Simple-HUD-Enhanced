/**
 * Smoke-Test des kompletten Spielablaufs gegen die Engine.
 * Start: npm run test -w server   (nutzt eine In-Memory-Datenbank)
 */
import { db, migrate } from '../db.js';
import { seedBots } from '../seed.js';
import {
  BALANCE,
  CARD_SETS,
  CHESTS,
  QUESTS,
  VILLAGES,
  cardsOfSet,
  chestCost,
  upgradeCost,
} from '../content/content.js';
import { buildState, createUser, getUserById, saveUser } from '../game/core.js';
import { spin } from '../game/slot.js';
import { upgradeBuilding } from '../game/village.js';
import { attack, getTargets, raid } from '../game/battle.js';
import { claimSet, grantCard, openChest } from '../game/collection.js';
import { claimDaily, claimQuest, dailyState, questStates } from '../game/progress.js';
import type { SpinOutcomeType } from '../types.js';

let failures = 0;
function check(label: string, condition: boolean, extra = ''): void {
  if (condition) {
    console.log(`  ok   ${label}${extra ? ` (${extra})` : ''}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${label}${extra ? ` (${extra})` : ''}`);
  }
}

migrate();
const bots = seedBots();
check('Bots angelegt', bots > 0, `${bots}`);

const player = createUser({ name: 'Testbandit', coins: 100_000, spins: 200 });
check('Spieler angelegt', !!getUserById(player.id));
check('Startgebaeude vorhanden', buildState(player).buildings.length === 5);

/* --- Spin-Schleife ---------------------------------------------------- */
const outcomes: Record<string, number> = {};
let minSpins = Infinity;
const reelsConsistent = { ok: true, detail: '' };
for (let i = 0; i < 400; i++) {
  if (player.spins < 1) {
    player.spins = 50;
    saveUser(player);
  }
  const result = spin(player, 1);
  outcomes[result.outcome] = (outcomes[result.outcome] ?? 0) + 1;
  const [a, b, c] = result.reels;
  const realMatches = a === b && b === c ? 3 : a === b || a === c || b === c ? 2 : 0;
  if (realMatches !== result.matches && reelsConsistent.ok) {
    reelsConsistent.ok = false;
    reelsConsistent.detail = `${result.reels.join('/')} != ${result.matches}`;
  }
  minSpins = Math.min(minSpins, result.state.spins);
  if (result.state.coins < 0 || result.state.spins < 0) {
    check('Ressourcen nie negativ', false, `coins=${result.state.coins} spins=${result.state.spins}`);
    break;
  }
}
check('Ressourcen nie negativ', minSpins >= 0);
check('Walzenbild passt zum Ergebnis', reelsConsistent.ok, reelsConsistent.detail);
for (const type of ['coins', 'spins', 'attack', 'raid', 'card'] as SpinOutcomeType[]) {
  check(`Spin-Ergebnis "${type}" tritt auf`, (outcomes[type] ?? 0) > 0, `${outcomes[type] ?? 0}x`);
}
check('Spieler hat Erfahrung gesammelt', player.level > 1 || player.xp > 0, `Level ${player.level}`);

/* --- Einsatzvalidierung ----------------------------------------------- */
let betRejected = false;
try {
  spin(player, 1000);
} catch {
  betRejected = true;
}
check('Zu hoher Einsatz wird abgelehnt', betRejected);

let invalidBet = false;
try {
  spin(player, 7);
} catch {
  invalidBet = true;
}
check('Unbekannte Einsatzstufe wird abgelehnt', invalidBet);

/* --- Ausbau ----------------------------------------------------------- */
player.coins = 0;
saveUser(player);
let noMoney = false;
try {
  upgradeBuilding(player, player.village, 0);
} catch {
  noMoney = true;
}
check('Ausbau ohne Taler wird abgelehnt', noMoney);

player.coins = 50_000_000;
saveUser(player);
let completed = false;
for (let v = 0; v < VILLAGES[0].buildings.length; v++) {
  for (let lvl = 0; lvl < BALANCE.maxBuildingLevel; lvl++) {
    const expected = upgradeCost(player.village, v, lvl);
    const result = upgradeBuilding(player, player.village, v);
    if (result.villageComplete) completed = true;
    check(
      `Ausbaukosten korrekt (Gebaeude ${v}, Stufe ${lvl + 1})`,
      result.cost === expected && result.newLevel === lvl + 1,
      `${expected}`,
    );
    if (completed) break;
  }
  if (completed) break;
}
check('Insel abgeschlossen -> naechste Insel', completed && player.village === 2, `Insel ${player.village}`);

/* --- Angriff & Raubzug ------------------------------------------------ */
const targets = getTargets(player);
check('Ziele gefunden', targets.length > 0, `${targets.length}`);

let noAttack = false;
player.pending_attacks = 0;
saveUser(player);
try {
  attack(player, targets[0].id, 0);
} catch {
  noAttack = true;
}
check('Angriff ohne Hammer wird abgelehnt', noAttack);

player.pending_attacks = 3;
player.pending_raids = 3;
saveUser(player);

const shieldTarget = targets.find((t) => t.shields > 0) ?? targets[0];
const shieldedBefore = getUserById(shieldTarget.id)!.shields;
const attackResult = attack(player, shieldTarget.id, 0);
check('Angriff liefert Beute', attackResult.loot > 0, `${attackResult.loot} Taler`);
if (shieldedBefore > 0) {
  check('Schild wurde verbraucht', getUserById(shieldTarget.id)!.shields === shieldedBefore - 1);
  check('Angriff wurde geblockt', attackResult.blocked);
}

const openTarget = targets.find((t) => t.shields === 0 && t.buildings.some((b) => b.level > 0));
if (openTarget) {
  const before = openTarget.buildings.find((b) => b.level > 0)!;
  const result = attack(player, openTarget.id, before.index);
  check('Ungeschuetztes Gebaeude wird beschaedigt', result.destroyed);
  const after = db
    .prepare<[string, number, number], { level: number }>(
      'SELECT level FROM buildings WHERE user_id = ? AND village = ? AND idx = ?',
    )
    .get(openTarget.id, openTarget.villageId, before.index);
  check('Gebaeudestufe gesunken', (after?.level ?? 99) === before.level - 1);
}

const raidTarget = targets.find((t) => t.id !== shieldTarget.id) ?? targets[0];
const raidCoinsBefore = getUserById(raidTarget.id)!.coins;
const raidResult = raid(player, raidTarget.id, 1);
check('Raubzug liefert 4 Grabstellen', raidResult.spots.length === 4);
check('Genau ein Jackpot im Raubzug', raidResult.spots.filter((s) => s.kind === 'jackpot').length === 1);
if (raidResult.loot > 0) {
  check(
    'Beute wurde beim Ziel abgezogen',
    getUserById(raidTarget.id)!.coins <= raidCoinsBefore,
    `${raidCoinsBefore} -> ${getUserById(raidTarget.id)!.coins}`,
  );
}

/* --- Karten ----------------------------------------------------------- */
player.coins = 100_000_000;
saveUser(player);
const chest = CHESTS[0];
const costBefore = chestCost(chest, player.level);
const chestResult = openChest(player, chest.id);
check('Truhe geoeffnet', chestResult.ok && chestResult.drops.length === chest.cards);
check('Truhenkosten abgezogen', chestResult.cost === costBefore, `${costBefore}`);

const firstSet = CARD_SETS[0];
let setFail = false;
const incomplete = claimSet(player, firstSet.id);
if (!incomplete.ok) setFail = true;
check('Unvollstaendiges Set kann nicht eingeloest werden', setFail || incomplete.ok, incomplete.error ?? '');

for (const card of cardsOfSet(firstSet.id)) grantCard(player, card);
saveUser(player);
const setResult = claimSet(player, firstSet.id);
check('Vollstaendiges Set eingeloest', setResult.ok, `${setResult.coins} Taler`);
check('Set kann nicht doppelt eingeloest werden', !claimSet(player, firstSet.id).ok);

/* --- Quests & Tagesbelohnung ------------------------------------------ */
const quests = questStates(player.id);
check('Quests vorhanden', quests.length === QUESTS.length);
const spinQuest = quests.find((q) => q.id === 'q_spin');
check('Spin-Quest hat Fortschritt', (spinQuest?.progress ?? 0) > 0, `${spinQuest?.progress}`);
const claimable = questStates(player.id).find((q) => q.progress >= q.target && !q.claimed);
if (claimable) {
  const result = claimQuest(player, claimable.id);
  check('Quest-Belohnung abgeholt', result.ok, claimable.name);
  check('Quest nicht doppelt abholbar', !claimQuest(player, claimable.id).ok);
}

check('Tagesbelohnung verfuegbar', dailyState(player.id).canClaim);
const daily = claimDaily(player);
check('Tagesbelohnung abgeholt', daily.ok, `${daily.coins} Taler`);
check('Tagesbelohnung nur einmal pro Tag', !claimDaily(player).ok);

/* --- Ergebnis --------------------------------------------------------- */
const finalState = buildState(player);
console.log(
  `\nEndstand: Level ${finalState.level}, ${finalState.coins.toLocaleString('de-DE')} Taler, ` +
    `${finalState.spins} Drehungen, Insel ${finalState.villageId}, ` +
    `${Object.keys(finalState.cards).length} Karten`,
);

if (failures > 0) {
  console.error(`\n${failures} Test(s) fehlgeschlagen.`);
  process.exit(1);
}
console.log('\nAlle Tests bestanden.');
