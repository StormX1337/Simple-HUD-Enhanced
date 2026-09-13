import { db, now, type UserRow } from '../db.js';
import { getUserByName, getUserById, refreshBot } from './core.js';
import { GameError } from './slot.js';
import { getTarget, type TargetInfo } from './battle.js';

export interface FriendInfo extends TargetInfo {
  since: number;
}

/** Alle Freunde mit den Infos, die auch Ziele mitbringen. */
export function friendList(user: UserRow): FriendInfo[] {
  const rows = db
    .prepare<[string], { friend_id: string; created_at: number }>(
      'SELECT friend_id, created_at FROM friends WHERE user_id = ? ORDER BY created_at DESC',
    )
    .all(user.id);
  const friends: FriendInfo[] = [];
  for (const row of rows) {
    const other = getUserById(row.friend_id);
    if (!other) continue;
    refreshBot(other);
    friends.push({ ...getTarget(user, other.id), since: row.created_at });
  }
  return friends;
}

export function friendIds(userId: string): string[] {
  return db
    .prepare<[string], { friend_id: string }>('SELECT friend_id FROM friends WHERE user_id = ?')
    .all(userId)
    .map((row) => row.friend_id);
}

/** Freundschaft schließen – beide Richtungen, damit Angriffe gegenseitig möglich sind. */
export function addFriend(user: UserRow, name: string): FriendInfo {
  const trimmed = name.trim();
  if (trimmed.length < 2) throw new GameError('Bitte einen Namen eingeben');
  const other = getUserByName(trimmed);
  if (!other) throw new GameError(`"${trimmed}" spielt noch nicht mit`, 404);
  if (other.id === user.id) throw new GameError('Dich selbst kannst du nicht hinzufügen');

  const existing = db
    .prepare('SELECT friend_id FROM friends WHERE user_id = ? AND friend_id = ?')
    .get(user.id, other.id);
  if (existing) throw new GameError(`${other.name} ist schon dein Freund`);

  const ts = now();
  const insert = db.prepare(
    'INSERT OR IGNORE INTO friends (user_id, friend_id, created_at) VALUES (?, ?, ?)',
  );
  const tx = db.transaction(() => {
    insert.run(user.id, other.id, ts);
    insert.run(other.id, user.id, ts);
  });
  tx();

  return { ...getTarget(user, other.id), since: ts };
}

export function removeFriend(user: UserRow, friendId: string): void {
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM friends WHERE user_id = ? AND friend_id = ?').run(user.id, friendId);
    db.prepare('DELETE FROM friends WHERE user_id = ? AND friend_id = ?').run(friendId, user.id);
  });
  tx();
}
