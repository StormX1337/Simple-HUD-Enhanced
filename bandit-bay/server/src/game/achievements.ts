import { db, now, type UserRow } from '../db.js';
import {
  ACHIEVEMENTS,
  achievementById,
  spinCapacity,
  type AchievementMetric,
} from '../content/content.js';
import { addXp, getCards, getClaimedSets, logEvent, saveUser } from './core.js';
import { GameError } from './slot.js';

export interface AchievementState {
  id: string;
  name: string;
  description: string;
  target: number;
  progress: number;
  done: boolean;
  claimed: boolean;
  reward: { coins: number; spins: number; xp: number };
}

function metricValue(user: UserRow, metric: AchievementMetric): number {
  switch (metric) {
    case 'spins':
      return user.total_spins;
    case 'attacks':
      return user.total_attacks;
    case 'raids':
      return user.total_raids;
    case 'level':
      return user.level;
    case 'village':
      return user.village;
    case 'cards':
      return Object.values(getCards(user.id)).filter((count) => count > 0).length;
    case 'sets':
      return getClaimedSets(user.id).length;
    default:
      return 0;
  }
}

function claimedIds(userId: string): string[] {
  return db
    .prepare<[string], { ach_id: string }>('SELECT ach_id FROM achievements WHERE user_id = ?')
    .all(userId)
    .map((row) => row.ach_id);
}

export function achievementStates(user: UserRow): AchievementState[] {
  const claimed = claimedIds(user.id);
  return ACHIEVEMENTS.map((entry) => {
    const progress = Math.min(entry.target, metricValue(user, entry.metric));
    return {
      id: entry.id,
      name: entry.name,
      description: entry.description,
      target: entry.target,
      progress,
      done: progress >= entry.target,
      claimed: claimed.includes(entry.id),
      reward: entry.reward,
    };
  });
}

export interface AchievementClaim {
  id: string;
  coins: number;
  spins: number;
  xp: number;
  levelUps: number;
}

export function claimAchievement(user: UserRow, id: string): AchievementClaim {
  const entry = achievementById(id);
  if (!entry) throw new GameError('Unbekannter Meilenstein', 404);
  if (claimedIds(user.id).includes(id)) throw new GameError('Belohnung bereits abgeholt');
  if (metricValue(user, entry.metric) < entry.target)
    throw new GameError('Meilenstein noch nicht erreicht');

  db.prepare('INSERT INTO achievements (user_id, ach_id, claimed_at) VALUES (?, ?, ?)').run(
    user.id,
    id,
    now(),
  );
  user.coins += entry.reward.coins;
  user.spins = Math.min(spinCapacity(user.level), user.spins + entry.reward.spins);
  const levelUps = addXp(user, entry.reward.xp);
  saveUser(user);
  logEvent({ userId: user.id, type: 'quest', amount: entry.reward.coins, detail: entry.name });

  return {
    id,
    coins: entry.reward.coins,
    spins: entry.reward.spins,
    xp: entry.reward.xp,
    levelUps,
  };
}
