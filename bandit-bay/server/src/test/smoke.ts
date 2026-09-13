/**
 * Smoke-Test des kompletten Spielablaufs gegen die Engine.
 * Start: npm run test -w server   (nutzt eine In-Memory-Datenbank)
 */
import { db, migrate } from '../db.js';
import { seedBots } from '../seed.js';
import {
  BALANCE,
  CARD_SETS,
  eventStatus,
  tournamentCycle,
  upcomingEvents,
  CHESTS,
  QUESTS,
  VILLAGES,
  cardsOfSet,
  chestCost,
  upgradeCost,
} from '../content/content.js';
import { buildState, createUser, ensureBuildings, getUserById, saveUser } from '../game/core.js';
import { spin } from '../game/slot.js';
import { upgradeBuilding } from '../game/village.js';
import { attack, getTargets, prepareRaid, raid } from '../game/battle.js';
import { claimSet, effectiveChestCost, grantCard, openChest } from '../game/collection.js';
import { claimDaily, claimQuest, dailyState, questStates } from '../game/progress.js';
import { feedPet, petBonus, petStates } from '../game/pets.js';
import { markNewsSeen, simulateAbsence, unseenNews } from '../game/absence.js';
import { achievementStates, claimAchievement } from '../game/achievements.js';
import { spinWheel, wheelStatus } from '../game/wheel.js';
import { claimTournament, tournamentState } from '../game/tournament.js';
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
      `Ausbaukosten korrekt (Gebäude ${v}, Stufe ${lvl + 1})`,
      result.cost === expected && result.newLevel === lvl + 1,
      `${expected}`,
    );
    if (completed) break;
  }
  if (completed) break;
}
check('Insel abgeschlossen -> nächste Insel', completed && player.village === 2, `Insel ${player.village}`);

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
  check('Ungeschütztes Gebäude wird beschädigt', result.destroyed);
  const after = db
    .prepare<[string, number, number], { level: number }>(
      'SELECT level FROM buildings WHERE user_id = ? AND village = ? AND idx = ?',
    )
    .get(openTarget.id, openTarget.villageId, before.index);
  check('Gebäudestufe gesunken', (after?.level ?? 99) === before.level - 1);
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
check('Truhe geöffnet', chestResult.ok && chestResult.drops.length === chest.cards);
check('Truhenkosten abgezogen', chestResult.cost === costBefore, `${costBefore}`);

const firstSet = CARD_SETS[0];
// Durch die vielen Drehungen kann das Set bereits vollständig sein – beide Fälle prüfen.
const earlyClaim = claimSet(player, firstSet.id);
if (earlyClaim.ok) {
  check('Bereits vollständiges Set eingelöst', true, `${earlyClaim.coins} Taler`);
} else {
  check('Unvollständiges Set kann nicht eingelöst werden', !earlyClaim.ok, earlyClaim.error ?? '');
  for (const card of cardsOfSet(firstSet.id)) grantCard(player, card);
  saveUser(player);
  const setResult = claimSet(player, firstSet.id);
  check('Vollständiges Set eingelöst', setResult.ok, `${setResult.coins} Taler`);
}
check('Set kann nicht doppelt eingelöst werden', !claimSet(player, firstSet.id).ok);

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

check('Tagesbelohnung verfügbar', dailyState(player.id).canClaim);
const daily = claimDaily(player);
check('Tagesbelohnung abgeholt', daily.ok, `${daily.coins} Taler`);
check('Tagesbelohnung nur einmal pro Tag', !claimDaily(player).ok);

/* --- Begleiter -------------------------------------------------------- */
const pets = petStates(player);
check('Begleiter vorhanden', pets.length === 5, `${pets.length}`);
const fina = pets.find((pet) => pet.id === 'fina');
check('Fina ist freigeschaltet', !!fina?.unlocked);
check('Kein Begleiter zu Beginn aktiv', pets.every((pet) => !pet.active));

player.coins = 0;
saveUser(player);
let feedFailed = false;
try {
  feedPet(player, 'fina');
} catch {
  feedFailed = true;
}
check('Füttern ohne Taler wird abgelehnt', feedFailed);

player.coins = 5_000_000;
saveUser(player);
const coinsBeforeFeed = player.coins;
const feed = feedPet(player, 'fina');
check('Fina gefüttert', feed.cost > 0 && player.coins === coinsBeforeFeed - feed.cost, `${feed.cost} Taler`);
check('Raubzug-Bonus aktiv', petBonus(player.id, 'raid') > 1, `${petBonus(player.id, 'raid')}`);
check('Angriffs-Bonus inaktiv', petBonus(player.id, 'attack') === 1);
check('Begleiter im Zustand sichtbar', buildState(player).activePet?.id === 'fina');

const bodoUnlocked = petStates(player).find((pet) => pet.id === 'bodo')?.unlocked;
if (bodoUnlocked) {
  feedPet(player, 'bodo');
  const after = petStates(player).filter((pet) => pet.active);
  check('Nur ein Begleiter gleichzeitig aktiv', after.length === 1 && after[0].id === 'bodo');
}

/* --- Abwesenheit ------------------------------------------------------ */
player.level = Math.max(player.level, 5);
player.coins = 1_000_000;
player.shields = 1;
player.last_sim = Date.now() - 13 * 3_600_000;
saveUser(player);
const coinsBeforeAbsence = player.coins;
const shieldsBefore = player.shields;
simulateAbsence(player);
const news = unseenNews(player);
check(
  'Abwesenheit erzeugt Ereignisse oder bleibt ruhig',
  news.length >= 0 && player.coins <= coinsBeforeAbsence && player.shields <= shieldsBefore,
  `${news.length} Ereignis(se)`,
);
check('Verluste bleiben gedeckelt', player.coins >= coinsBeforeAbsence * 0.79);
check('Simulation läuft nicht doppelt', (simulateAbsence(player), unseenNews(player).length === news.length));
if (news.length > 0) {
  markNewsSeen(player);
  check('Gesehene Ereignisse verschwinden', unseenNews(player).length === 0);
}

/* --- Meilensteine ----------------------------------------------------- */
const achievements = achievementStates(player);
check('Meilensteine vorhanden', achievements.length > 0, `${achievements.length}`);
const spinsAch = achievements.find((entry) => entry.id === 'spins_100');
check('Spin-Meilenstein zählt mit', (spinsAch?.progress ?? 0) > 0, `${spinsAch?.progress}`);

const doneAchievement = achievementStates(player).find((entry) => entry.done && !entry.claimed);
if (doneAchievement) {
  const coinsBeforeAchievement = player.coins;
  const claimed = claimAchievement(player, doneAchievement.id);
  check(
    'Meilenstein-Belohnung abgeholt',
    player.coins === coinsBeforeAchievement + claimed.coins,
    doneAchievement.name,
  );
  let twice = false;
  try {
    claimAchievement(player, doneAchievement.id);
  } catch {
    twice = true;
  }
  check('Meilenstein nicht doppelt abholbar', twice);
}
let tooEarly = false;
try {
  claimAchievement(player, 'village_6');
} catch {
  tooEarly = true;
}
check('Nicht erreichter Meilenstein wird abgelehnt', tooEarly);

/* --- Glücksrad -------------------------------------------------------- */
const wheelBefore = wheelStatus(player);
check('Glücksrad hat acht Felder', wheelBefore.segments.length === 8);
check('Glücksrad ist verfügbar', wheelBefore.canSpin);
player.spins = 0;
saveUser(player);
const coinsBeforeWheel = player.coins;
const spinsBeforeWheel = player.spins;
const wheelResult = spinWheel(player);
check(
  'Glücksrad zahlt aus',
  wheelResult.coins > 0 ||
    wheelResult.spins > 0 ||
    wheelResult.shields > 0 ||
    wheelResult.card !== null,
  wheelResult.segment.label,
);
check(
  'Gewinn wurde gutgeschrieben',
  player.coins >= coinsBeforeWheel && player.spins >= spinsBeforeWheel,
);
let wheelTwice = false;
try {
  spinWheel(player);
} catch {
  wheelTwice = true;
}
check('Glücksrad nur einmal pro Tag', wheelTwice);

/* --- Events ----------------------------------------------------------- */
const windows = upcomingEvents(Date.now(), 6);
check('Event-Zeitplan vorhanden', windows.length === 6, windows.map((w) => w.kind).join(','));
check(
  'Event-Typen wechseln',
  new Set(windows.map((entry) => entry.kind)).size > 1,
  `${new Set(windows.map((entry) => entry.kind)).size} Typen`,
);
const noon = Date.UTC(2026, 8, 13, 12, 30);
check('Mittagsfenster ist aktiv', eventStatus(noon).active, eventStatus(noon).name);
check('Nachts läuft kein Event', !eventStatus(Date.UTC(2026, 8, 13, 3, 0)).active);

/* --- Begleiter-Fähigkeiten -------------------------------------------- */
player.village = 5;
player.coins = 50_000_000;
saveUser(player);
ensureBuildings(player.id, 5);

// Fina: deckt eine leere Grabstelle auf
feedPet(player, 'fina');
const finaTarget = getTargets(player)[0];
const prepared = prepareRaid(player, finaTarget.id);
check('Fina deckt eine Stelle auf', prepared.revealedIndex !== null, `Stelle ${prepared.revealedIndex}`);
player.pending_raids = 1;
saveUser(player);
const preparedRaid = raid(player, finaTarget.id, prepared.revealedIndex === 0 ? 1 : 0);
check(
  'Aufgedeckte Stelle war wirklich leer',
  preparedRaid.spots[prepared.revealedIndex ?? 0].kind === 'empty',
);

// Otto: Truhenrabatt und wertvollere Duplikate
const listPrice = chestCost(CHESTS[0], player.level);
feedPet(player, 'otto');
const discounted = effectiveChestCost(player, CHESTS[0].id);
check('Otto verbilligt Truhen', discounted < listPrice, `${listPrice} -> ${discounted}`);

// Bodo: Doppelschlag ist möglich
feedPet(player, 'bodo');
check('Bodo ist aktiv', buildState(player).activePet?.id === 'bodo');
check('Begleiter hat eine Stufe', (petStates(player).find((p) => p.id === 'bodo')?.level ?? 0) >= 1);

// Stufenaufstieg durch mehrfaches Füttern
for (let i = 0; i < 4; i++) feedPet(player, 'fina');
const finaState = petStates(player).find((entry) => entry.id === 'fina');
check('Begleiter steigt auf', (finaState?.level ?? 1) > 1, `Stufe ${finaState?.level}`);
check(
  'Bonus wächst mit der Stufe',
  (finaState?.bonus ?? 0) > 0.4,
  `${Math.round((finaState?.bonus ?? 0) * 100)} %`,
);

/* --- Turnier ---------------------------------------------------------- */
const tournament = tournamentState(player);
check('Turnier läuft', tournament.endsInSeconds > 0, `${Math.round(tournament.endsInSeconds / 3600)}h`);
check('Turnierpunkte gesammelt', tournament.myPoints > 0, `${tournament.myPoints} Punkte`);
check('Rangliste gefüllt', tournament.entries.length > 1, `${tournament.entries.length} Einträge`);
check(
  'Eigener Eintrag hat einen Rang',
  tournament.myRank >= 1 && tournament.myRank <= tournament.entries.length + 1,
  `Rang ${tournament.myRank}`,
);
let noReward = false;
try {
  claimTournament(player);
} catch {
  noReward = true;
}
check('Ohne abgeschlossenen Zyklus gibt es nichts', noReward);

// Vorherigen Zyklus simulieren und Preis abholen
const lastCycle = tournamentCycle() - 1;
db.prepare(
  'INSERT OR REPLACE INTO tournament (user_id, cycle, points, claimed) VALUES (?, ?, ?, 0)',
).run(player.id, lastCycle, 5_000);
const coinsBeforePrize = player.coins;
const prize = claimTournament(player);
check('Turnierpreis abgeholt', prize.coins > 0 && player.coins > coinsBeforePrize, `Rang ${prize.rank}`);
let prizeTwice = false;
try {
  claimTournament(player);
} catch {
  prizeTwice = true;
}
check('Turnierpreis nur einmal', prizeTwice);

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
