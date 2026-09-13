import { db, type UserRow } from '../db.js';
import type { SpinResult, SymbolId, SpinOutcomeType } from '../types.js';
import {
  BALANCE,
  NO_MATCH_WEIGHT,
  SPIN_TABLE,
  SYMBOLS,
  coinValue,
  coinEventMultiplier,
  shieldEventBonus,
  spinEventMultiplier,
  maxBetForLevel,
  spinCapacity,
  type PayoutEntry,
} from '../content/content.js';
import {
  addXp,
  applyRegen,
  buildState,
  logEvent,
  pickWeighted,
  saveUser,
} from './core.js';
import { grantRandomCard } from './collection.js';
import { petBonus, rollPetAbility } from './pets.js';
import { trackQuest } from './progress.js';

export class GameError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function rollSymbol(exclude: SymbolId[] = []): SymbolId {
  const pool = SYMBOLS.filter((s) => !exclude.includes(s.id));
  return pickWeighted(pool.length > 0 ? pool : SYMBOLS, (s) => s.weight).id;
}

/** Zieht das Ergebnis gewichtet aus der Gewinntabelle. */
function rollOutcome(): { matches: 3 | 2 | 0; symbol: SymbolId | null } {
  const entries: (PayoutEntry | null)[] = [...SPIN_TABLE, null];
  const chosen = pickWeighted(entries, (entry) => (entry ? entry.weight : NO_MATCH_WEIGHT));
  if (!chosen) return { matches: 0, symbol: null };
  return { matches: chosen.matches, symbol: chosen.symbol };
}

/** Baut die sichtbaren Walzen passend zum gezogenen Ergebnis. */
function buildReels(matches: 3 | 2 | 0, symbol: SymbolId | null): SymbolId[] {
  if (matches === 3 && symbol) return [symbol, symbol, symbol];
  if (matches === 2 && symbol) {
    const filler = rollSymbol([symbol]);
    const reels = [symbol, symbol, filler];
    const shift = Math.floor(Math.random() * 3);
    return [reels[(0 + shift) % 3], reels[(1 + shift) % 3], reels[(2 + shift) % 3]];
  }
  const a = rollSymbol();
  const b = rollSymbol([a]);
  const c = rollSymbol([a, b]);
  return [a, b, c];
}

export function spin(user: UserRow, betInput: number): SpinResult {
  const maxBet = maxBetForLevel(user.level);
  const bet = Math.round(betInput);
  if (!BALANCE.betTiers.includes(bet as never)) throw new GameError('Ungültiger Einsatz');
  if (bet > maxBet) throw new GameError(`Einsatz x${bet} ist erst ab Level freigeschaltet`);

  applyRegen(user);
  if (user.spins < bet) throw new GameError('Nicht genug Drehungen');

  user.spins -= bet;
  user.bet = bet;
  user.total_spins += 1;

  // Begleiter-Fähigkeit: Pia gibt die Drehung manchmal zurück.
  const refunded = rollPetAbility(user.id, 'refund');
  if (refunded) user.spins = Math.min(spinCapacity(user.level), user.spins + bet);

  const { matches, symbol } = rollOutcome();
  const reels: SymbolId[] = buildReels(matches, symbol);
  const base =
    coinValue(user.level, user.village) * coinEventMultiplier() * petBonus(user.id, 'coins');
  const spinBonus = spinEventMultiplier();

  let outcome: SpinOutcomeType = 'nothing';
  let amount = 0;
  let message = 'Kein Treffer – dreh weiter!';
  let card: SpinResult['card'];
  let cardIsNew = false;

  const gainCoins = (value: number, text: string) => {
    outcome = 'coins';
    amount = Math.max(1, Math.round(value));
    user.coins += amount;
    message = text;
    trackQuest(user.id, 'coins', amount);
  };

  if (matches === 3 && symbol) {
    switch (symbol) {
      case 'taler':
        gainCoins(base * bet * 12, 'Taler-Regen! Dreifacher Treffer!');
        break;
      case 'beutel': {
        const gain = 10 * bet * spinBonus;
        const before = user.spins;
        user.spins = Math.min(spinCapacity(user.level), user.spins + gain);
        amount = user.spins - before;
        if (amount > 0) {
          outcome = 'spins';
          message = `Beutel voll: +${amount} Drehungen!`;
        } else {
          // Drehungen sind voll – dafür klingeln die Taler.
          gainCoins(base * bet * 8, 'Drehungen voll – der Beutel zahlt in Talern!');
        }
        break;
      }
      case 'schild':
        if (user.shields < BALANCE.maxShields) {
          outcome = 'shield';
          const before = user.shields;
          user.shields = Math.min(BALANCE.maxShields, user.shields + shieldEventBonus());
          amount = user.shields - before;
          message =
            amount > 1
              ? `Schildstunde: +${amount} Schilde für dein Dorf!`
              : 'Schild aufgebaut – dein Dorf ist geschützt!';
        } else {
          gainCoins(base * bet * 5, 'Schilde voll – dafür klingeln die Taler!');
        }
        break;
      case 'hammer':
        outcome = 'attack';
        user.pending_attacks += 1;
        amount = 1;
        message = 'Sturmhammer! Such dir ein Ziel aus.';
        break;
      case 'pfote':
        outcome = 'raid';
        user.pending_raids += 1;
        amount = 1;
        message = 'Banditenpfote! Zeit für einen Raubzug.';
        break;
      case 'truhe': {
        const drop = grantRandomCard(user);
        outcome = 'card';
        card = drop.card;
        cardIsNew = drop.isNew;
        amount = Math.round(base * bet * 2) + drop.coins;
        user.coins += Math.round(base * bet * 2);
        message = drop.isNew
          ? `Neue Karte gefunden: ${drop.card.name}!`
          : `Karte doppelt: ${drop.card.name} (+${drop.coins} Taler)`;
        break;
      }
    }
  } else if (matches === 2 && symbol) {
    switch (symbol) {
      case 'taler':
        gainCoins(base * bet * 3, 'Zwei Taler – kleiner Gewinn!');
        break;
      case 'beutel': {
        const gain = 3 * bet * spinBonus;
        const before = user.spins;
        user.spins = Math.min(spinCapacity(user.level), user.spins + gain);
        amount = user.spins - before;
        if (amount > 0) {
          outcome = 'spins';
          message = `+${amount} Drehungen`;
        } else {
          gainCoins(base * bet * 2, 'Drehungen voll – dafür ein paar Taler.');
        }
        break;
      }
      case 'schild':
        gainCoins(
          base * bet * 2 * shieldEventBonus(),
          shieldEventBonus() > 1
            ? 'Schildstunde: zwei Schilde zahlen doppelt!'
            : 'Zwei Schilde – Trostpreis in Talern.',
        );
        break;
      case 'hammer':
        gainCoins(base * bet * 2, 'Zwei Hämmer – ein paar Taler fallen ab.');
        break;
      case 'pfote':
        gainCoins(base * bet * 2, 'Zwei Pfoten – kleine Beute.');
        break;
      case 'truhe':
        gainCoins(base * bet * 2.5, 'Zwei Truhen – Talerfund!');
        break;
    }
  }

  trackQuest(user.id, 'spin', 1);
  const levelUps = addXp(user, Math.min(60, 3 + bet * 0.4));
  saveUser(user);

  if (matches === 3) {
    logEvent({ userId: user.id, type: 'spin', amount, detail: message });
  }

  return {
    reels,
    refunded,
    matches,
    outcome,
    amount,
    card,
    cardIsNew,
    message,
    levelUps,
    state: buildState(user),
  };
}

/** Einsatz aendern (server-validiert). */
export function setBet(user: UserRow, bet: number): void {
  if (!BALANCE.betTiers.includes(bet as never)) throw new GameError('Ungültiger Einsatz');
  if (bet > maxBetForLevel(user.level)) throw new GameError('Einsatz noch nicht freigeschaltet');
  user.bet = bet;
  saveUser(user);
}
