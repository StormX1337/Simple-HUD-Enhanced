import { db, now, type PetRow, type UserRow } from '../db.js';
import {
  PETS,
  PET_DURATION_HOURS,
  petById,
  petCost,
  type PetDef,
  type PetEffect,
} from '../content/content.js';
import { logEvent, saveUser } from './core.js';
import { GameError } from './slot.js';

export interface PetState {
  id: string;
  name: string;
  animal: string;
  art: PetDef['art'];
  description: string;
  effect: PetEffect;
  bonus: number;
  color: string;
  unlockVillage: number;
  unlocked: boolean;
  cost: number;
  active: boolean;
  secondsLeft: number;
  feeds: number;
}

function petRows(userId: string): PetRow[] {
  return db.prepare<[string], PetRow>('SELECT * FROM pets WHERE user_id = ?').all(userId);
}

export function petStates(user: UserRow): PetState[] {
  const rows = petRows(user.id);
  const ts = now();
  return PETS.map((pet) => {
    const row = rows.find((entry) => entry.pet_id === pet.id);
    const activeUntil = row?.active_until ?? 0;
    const active = activeUntil > ts;
    return {
      id: pet.id,
      name: pet.name,
      animal: pet.animal,
      art: pet.art,
      description: pet.description,
      effect: pet.effect,
      bonus: pet.bonus,
      color: pet.color,
      unlockVillage: pet.unlockVillage,
      unlocked: user.village >= pet.unlockVillage,
      cost: petCost(pet, user.level),
      active,
      secondsLeft: active ? Math.ceil((activeUntil - ts) / 1000) : 0,
      feeds: row?.feeds ?? 0,
    };
  });
}

/** Aktiver Begleiter (höchstens einer gleichzeitig). */
export function activePet(userId: string): PetDef | null {
  const ts = now();
  const row = petRows(userId).find((entry) => entry.active_until > ts);
  return row ? (petById(row.pet_id) ?? null) : null;
}

/** Bonusfaktor eines Effekts, z. B. 1.4 wenn Fina aktiv ist. */
export function petBonus(userId: string, effect: PetEffect): number {
  const pet = activePet(userId);
  return pet && pet.effect === effect ? 1 + pet.bonus : 1;
}

export interface FeedResult {
  petId: string;
  cost: number;
  secondsLeft: number;
}

/** Begleiter füttern: kostet Taler und aktiviert ihn für einige Stunden. */
export function feedPet(user: UserRow, petId: string): FeedResult {
  const pet = petById(petId);
  if (!pet) throw new GameError('Unbekannter Begleiter', 404);
  if (user.village < pet.unlockVillage)
    throw new GameError(`${pet.name} schließt sich dir erst auf Insel ${pet.unlockVillage} an`);

  const cost = petCost(pet, user.level);
  if (user.coins < cost) throw new GameError('Nicht genug Taler für das Futter');

  const ts = now();
  const activeUntil = ts + PET_DURATION_HOURS * 3_600_000;
  user.coins -= cost;
  saveUser(user);

  const tx = db.transaction(() => {
    // Nur ein Begleiter ist gleichzeitig aktiv.
    db.prepare('UPDATE pets SET active_until = 0 WHERE user_id = ?').run(user.id);
    db.prepare(
      `INSERT INTO pets (user_id, pet_id, active_until, feeds) VALUES (?, ?, ?, 1)
       ON CONFLICT(user_id, pet_id) DO UPDATE SET active_until = excluded.active_until, feeds = feeds + 1`,
    ).run(user.id, pet.id, activeUntil);
  });
  tx();

  logEvent({ userId: user.id, type: 'pet', amount: -cost, detail: `${pet.name} gefüttert` });
  return { petId: pet.id, cost, secondsLeft: PET_DURATION_HOURS * 3600 };
}
