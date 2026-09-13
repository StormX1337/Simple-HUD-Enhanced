import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface UserRow {
  id: string;
  name: string;
  token: string;
  avatar: string;
  is_bot: number;
  coins: number;
  spins: number;
  shields: number;
  level: number;
  xp: number;
  village: number;
  bet: number;
  pending_attacks: number;
  pending_raids: number;
  last_regen: number;
  total_spins: number;
  total_attacks: number;
  total_raids: number;
  times_raided: number;
  last_sim: number;
  last_seen_event: number;
  created_at: number;
  updated_at: number;
}

export interface BuildingRow {
  user_id: string;
  village: number;
  idx: number;
  level: number;
}

export interface CardRow {
  user_id: string;
  card_id: string;
  count: number;
}

export interface QuestRow {
  user_id: string;
  day: string;
  quest_id: string;
  progress: number;
  claimed: number;
}

export interface PetRow {
  user_id: string;
  pet_id: string;
  active_until: number;
  feeds: number;
}

export interface EventRow {
  id: number;
  user_id: string;
  type: string;
  other_id: string;
  other_name: string;
  amount: number;
  detail: string;
  created_at: number;
}

const dbFile = process.env.DB_FILE ?? path.join(__dirname, '..', 'data', 'bandit-bay.db');

if (dbFile !== ':memory:') {
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });
}

export const db: Database.Database = new Database(dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      token TEXT NOT NULL UNIQUE,
      avatar TEXT NOT NULL DEFAULT '🦝',
      is_bot INTEGER NOT NULL DEFAULT 0,
      coins INTEGER NOT NULL DEFAULT 0,
      spins INTEGER NOT NULL DEFAULT 0,
      shields INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      xp INTEGER NOT NULL DEFAULT 0,
      village INTEGER NOT NULL DEFAULT 1,
      bet INTEGER NOT NULL DEFAULT 1,
      pending_attacks INTEGER NOT NULL DEFAULT 0,
      pending_raids INTEGER NOT NULL DEFAULT 0,
      last_regen INTEGER NOT NULL DEFAULT 0,
      total_spins INTEGER NOT NULL DEFAULT 0,
      total_attacks INTEGER NOT NULL DEFAULT 0,
      total_raids INTEGER NOT NULL DEFAULT 0,
      times_raided INTEGER NOT NULL DEFAULT 0,
      last_sim INTEGER NOT NULL DEFAULT 0,
      last_seen_event INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS buildings (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      village INTEGER NOT NULL,
      idx INTEGER NOT NULL,
      level INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, village, idx)
    );

    CREATE TABLE IF NOT EXISTS cards (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      card_id TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, card_id)
    );

    CREATE TABLE IF NOT EXISTS card_sets (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      set_id TEXT NOT NULL,
      claimed_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, set_id)
    );

    CREATE TABLE IF NOT EXISTS quests (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      day TEXT NOT NULL,
      quest_id TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      claimed INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, day, quest_id)
    );

    CREATE TABLE IF NOT EXISTS daily (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      streak INTEGER NOT NULL DEFAULT 0,
      last_day TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS pets (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pet_id TEXT NOT NULL,
      active_until INTEGER NOT NULL DEFAULT 0,
      feeds INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, pet_id)
    );

    CREATE TABLE IF NOT EXISTS raid_state (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      target_id TEXT NOT NULL,
      spots TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tournament (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cycle INTEGER NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      claimed INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, cycle)
    );

    CREATE INDEX IF NOT EXISTS idx_tournament_cycle ON tournament(cycle, points DESC);

    CREATE TABLE IF NOT EXISTS wheel (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      last_day TEXT NOT NULL DEFAULT '',
      spins INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS achievements (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ach_id TEXT NOT NULL,
      claimed_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, ach_id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      other_id TEXT NOT NULL DEFAULT '',
      other_name TEXT NOT NULL DEFAULT '',
      amount INTEGER NOT NULL DEFAULT 0,
      detail TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id, id DESC);
    CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);
  `);

  // Nachträglich ergänzte Spalten für bestehende Datenbanken.
  addColumnIfMissing('users', 'last_sim', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing('users', 'last_seen_event', 'INTEGER NOT NULL DEFAULT 0');
}

function addColumnIfMissing(table: string, column: string, definition: string): void {
  const columns = db
    .prepare<[], { name: string }>(`PRAGMA table_info(${table})`)
    .all()
    .map((row) => row.name);
  if (!columns.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function now(): number {
  return Date.now();
}

/** Tagesschluessel (UTC) für Quests und Tagesbelohnung. */
export function dayKey(ts: number = now()): string {
  return new Date(ts).toISOString().slice(0, 10);
}
