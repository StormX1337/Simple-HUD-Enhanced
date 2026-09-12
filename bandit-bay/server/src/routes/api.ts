import { Router, type NextFunction, type Request, type Response } from 'express';
import type { UserRow } from '../db.js';
import {
  BALANCE,
  CARDS,
  CARD_SETS,
  CHESTS,
  DAILY_LADDER,
  QUESTS,
  SYMBOLS,
  VILLAGES,
  chestCost,
  cardsOfSet,
  maxBetForLevel,
} from '../content/content.js';
import {
  applyRegen,
  buildState,
  createUser,
  getUserByName,
  getUserByToken,
  saveUser,
} from '../game/core.js';
import { GameError, setBet, spin } from '../game/slot.js';
import { upgradeBuilding } from '../game/village.js';
import { attack, getTargets, raid } from '../game/battle.js';
import { claimSet, grantRandomCard, openChest } from '../game/collection.js';
import {
  claimDaily,
  claimQuest,
  dailyState,
  history,
  leaderboard,
  questStates,
} from '../game/progress.js';

export const api = Router();

/* ------------------------------------------------------------------ */
/*  Authentifizierung                                                  */
/* ------------------------------------------------------------------ */

interface AuthedRequest extends Request {
  user?: UserRow;
}

function auth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return next(new GameError('Nicht angemeldet', 401));
  const user = getUserByToken(token);
  if (!user) return next(new GameError('Sitzung ungueltig', 401));
  applyRegen(user);
  saveUser(user);
  req.user = user;
  next();
}

function me(req: AuthedRequest): UserRow {
  if (!req.user) throw new GameError('Nicht angemeldet', 401);
  return req.user;
}

function num(value: unknown, fallback = NaN): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/* ------------------------------------------------------------------ */
/*  Inhalte (statisch)                                                 */
/* ------------------------------------------------------------------ */

api.get('/config', (_req, res) => {
  res.json({
    villages: VILLAGES,
    symbols: SYMBOLS,
    cards: CARDS,
    cardSets: CARD_SETS.map((set) => ({ ...set, cardIds: cardsOfSet(set.id).map((c) => c.id) })),
    chests: CHESTS,
    quests: QUESTS,
    dailyLadder: DAILY_LADDER,
    balance: {
      maxBuildingLevel: BALANCE.maxBuildingLevel,
      maxShields: BALANCE.maxShields,
      spinRegenSeconds: BALANCE.spinRegenSeconds,
      betTiers: BALANCE.betTiers,
      betTierLevels: BALANCE.betTierLevels,
    },
  });
});

/* ------------------------------------------------------------------ */
/*  Registrierung / Sitzung                                            */
/* ------------------------------------------------------------------ */

api.post('/auth/register', (req, res, next) => {
  try {
    const name = String(req.body?.name ?? '').trim();
    const avatar = String(req.body?.avatar ?? '🦝').slice(0, 4);
    if (name.length < 2 || name.length > 18)
      throw new GameError('Name muss 2 bis 18 Zeichen lang sein');
    if (getUserByName(name)) throw new GameError('Name ist schon vergeben', 409);
    const user = createUser({ name, avatar });
    res.json({ token: user.token, state: buildState(user) });
  } catch (error) {
    next(error);
  }
});

api.get('/auth/me', auth, (req: AuthedRequest, res) => {
  res.json({ state: buildState(me(req)) });
});

/* ------------------------------------------------------------------ */
/*  Spielzustand                                                       */
/* ------------------------------------------------------------------ */

api.get('/state', auth, (req: AuthedRequest, res) => {
  const user = me(req);
  res.json({
    state: buildState(user),
    quests: questStates(user.id),
    daily: dailyState(user.id),
  });
});

api.post('/spin', auth, (req: AuthedRequest, res, next) => {
  try {
    const user = me(req);
    const bet = num(req.body?.bet, user.bet);
    res.json(spin(user, bet));
  } catch (error) {
    next(error);
  }
});

api.post('/bet', auth, (req: AuthedRequest, res, next) => {
  try {
    const user = me(req);
    setBet(user, num(req.body?.bet, 1));
    res.json({ state: buildState(user) });
  } catch (error) {
    next(error);
  }
});

api.post('/village/upgrade', auth, (req: AuthedRequest, res, next) => {
  try {
    const user = me(req);
    const index = num(req.body?.index, -1);
    const result = upgradeBuilding(user, user.village, index);
    res.json({ ...result, state: buildState(user) });
  } catch (error) {
    next(error);
  }
});

/* ------------------------------------------------------------------ */
/*  Angriff & Raubzug                                                  */
/* ------------------------------------------------------------------ */

api.get('/targets', auth, (req: AuthedRequest, res) => {
  res.json({ targets: getTargets(me(req)) });
});

api.post('/attack', auth, (req: AuthedRequest, res, next) => {
  try {
    const user = me(req);
    const targetId = String(req.body?.targetId ?? '');
    const spotIndex = num(req.body?.spotIndex, -1);
    res.json(attack(user, targetId, spotIndex));
  } catch (error) {
    next(error);
  }
});

api.post('/raid', auth, (req: AuthedRequest, res, next) => {
  try {
    const user = me(req);
    const targetId = String(req.body?.targetId ?? '');
    const spotIndex = num(req.body?.spotIndex, -1);
    res.json(raid(user, targetId, spotIndex));
  } catch (error) {
    next(error);
  }
});

/* ------------------------------------------------------------------ */
/*  Karten                                                             */
/* ------------------------------------------------------------------ */

api.get('/collection', auth, (req: AuthedRequest, res) => {
  const user = me(req);
  const state = buildState(user);
  res.json({
    state,
    chests: CHESTS.map((chest) => ({ ...chest, cost: chestCost(chest, user.level) })),
    sets: CARD_SETS.map((set) => {
      const cards = cardsOfSet(set.id);
      const owned = cards.filter((card) => (state.cards[card.id] ?? 0) > 0).length;
      return {
        id: set.id,
        name: set.name,
        villageId: set.villageId,
        reward: set.reward,
        total: cards.length,
        owned,
        complete: owned === cards.length,
        claimed: state.claimedSets.includes(set.id),
      };
    }),
  });
});

api.post('/collection/chest', auth, (req: AuthedRequest, res, next) => {
  try {
    const user = me(req);
    const result = openChest(user, String(req.body?.chestId ?? ''));
    if (!result.ok) throw new GameError(result.error ?? 'Truhe konnte nicht geoeffnet werden');
    res.json({ ...result, state: buildState(user) });
  } catch (error) {
    next(error);
  }
});

api.post('/collection/set', auth, (req: AuthedRequest, res, next) => {
  try {
    const user = me(req);
    const result = claimSet(user, String(req.body?.setId ?? ''));
    if (!result.ok) throw new GameError(result.error ?? 'Set konnte nicht eingeloest werden');
    res.json({ ...result, state: buildState(user) });
  } catch (error) {
    next(error);
  }
});

/* ------------------------------------------------------------------ */
/*  Quests, Tagesbelohnung, Rangliste, Verlauf                         */
/* ------------------------------------------------------------------ */

api.get('/quests', auth, (req: AuthedRequest, res) => {
  res.json({ quests: questStates(me(req).id) });
});

api.post('/quests/claim', auth, (req: AuthedRequest, res, next) => {
  try {
    const user = me(req);
    const result = claimQuest(user, String(req.body?.questId ?? ''));
    if (!result.ok) throw new GameError(result.error ?? 'Quest kann nicht abgeholt werden');
    res.json({ ...result, quests: questStates(user.id), state: buildState(user) });
  } catch (error) {
    next(error);
  }
});

api.get('/daily', auth, (req: AuthedRequest, res) => {
  res.json({ daily: dailyState(me(req).id) });
});

api.post('/daily/claim', auth, (req: AuthedRequest, res, next) => {
  try {
    const user = me(req);
    const result = claimDaily(user);
    if (!result.ok) throw new GameError(result.error ?? 'Belohnung nicht verfuegbar');
    const drops = [];
    for (let i = 0; i < result.cards; i++) drops.push(grantRandomCard(user));
    saveUser(user);
    res.json({ ...result, drops, daily: dailyState(user.id), state: buildState(user) });
  } catch (error) {
    next(error);
  }
});

api.get('/leaderboard', auth, (req: AuthedRequest, res) => {
  res.json({ entries: leaderboard(me(req).id) });
});

api.get('/history', auth, (req: AuthedRequest, res) => {
  res.json({ entries: history(me(req).id) });
});

api.get('/profile', auth, (req: AuthedRequest, res) => {
  const user = me(req);
  res.json({
    state: buildState(user),
    maxBet: maxBetForLevel(user.level),
    history: history(user.id, 12),
  });
});
