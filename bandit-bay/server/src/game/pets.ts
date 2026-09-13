import { db, now, type PetRow, type UserRow } from '../db.js';
import {
  PETS,
  PET_DURATION_HOURS,
  PET_FEEDS_PER_LEVEL,
  PET_MAX_LEVEL,
  petAbilityChance,
  petBonusValue,
  petById,
  petCost,
  petLevel,
  type PetAbility,
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
  ability: PetAbility;
  abilityName: string;
  abilityText: string;
  abilityChance: number;
  color: string;
  unlockVillage: number;
  unlocked: boolean;
  cost: number;
  active: boolean;
  secondsLeft: number;
  feeds: number;
  level: number;
  maxLevel: number;
  feedsToNextLevel: number;
}

function petRows(userId: string): PetRow[] {
  return db.prepare<[string], PetRow>('SELECT * FROM pets WHERE user_id = ?').all(userId);
}

export function petStates(user: UserRow): PetState[] {
  const rows = petRows(user.id);
  const ts = now();
  return PETS.map((pet) => {
    const row = rows.find((entry) => entry.pet_id === pet.id);
    const feeds = row?.feeds ?? 0;
    const activeUntil = row?.active_until ?? 0;
    const active = activeUntil > ts;
    const level = petLevel(feeds);
    return {
      id: pet.id,
      name: pet.name,
      animal: pet.animal,
      art: pet.art,
      description: pet.description,
      effect: pet.effect,
      bonus: petBonusValue(pet, feeds),
      ability: pet.ability,
      abilityName: pet.abilityName,
      abilityText: pet.abilityText,
      abilityChance: petAbilityChance(pet, feeds),
      color: pet.color,
      unlockVillage: pet.unlockVillage,
      unlocked: user.village >= pet.unlockVillage,
      cost: petCost(pet, user.level),
      active,
      secondsLeft: active ? Math.ceil((activeUntil - ts) / 1000) : 0,
      feeds,
      level,
      maxLevel: PET_MAX_LEVEL,
      feedsToNextLevel:
        level >= PET_MAX_LEVEL ? 0 : PET_FEEDS_PER_LEVEL - (feeds % PET_FEEDS_PER_LEVEL),
    };
  });
}

interface ActivePet {
  def: PetDef;
  feeds: number;
}

/** Aktiver Begleiter (höchstens einer gleichzeitig). */
export function activePet(userId: string): ActivePet | null {
  const ts = now();
  const row = petRows(userId).find((entry) => entry.active_until > ts);
  if (!row) return null;
  const def = petById(row.pet_id);
  return def ? { def, feeds: row.feeds } : null;
}

/** Bonusfaktor eines Effekts, z. B. 1.4 wenn Fina aktiv ist. */
export function petBonus(userId: string, effect: PetEffect): number {
  const pet = activePet(userId);
  return pet && pet.def.effect === effect ? 1 + petBonusValue(pet.def, pet.feeds) : 1;
}

/** Ist die Fähigkeit dieses Begleiters gerade aktiv? */
export function hasPetAbility(userId: string, ability: PetAbility): boolean {
  const pet = activePet(userId);
  return !!pet && pet.def.ability === ability;
}

/** Fähigkeit auslösen (bei Fähigkeiten mit Zufallschance). */
export function rollPetAbility(userId: string, ability: PetAbility): boolean {
  const pet = activePet(userId);
  if (!pet || pet.def.ability !== ability) return false;
  const chance = petAbilityChance(pet.def, pet.feeds);
  return chance === 0 ? true : Math.random() < chance;
}

export interface FeedResult {
  petId: string;
  cost: number;
  secondsLeft: number;
  level: number;
  leveledUp: boolean;
}

/** Begleiter füttern: kostet Taler, aktiviert ihn und bringt ihn voran. */
export function feedPet(user: UserRow, petId: string): FeedResult {
  const pet = petById(petId);
  if (!pet) throw new GameError('Unbekannter Begleiter', 404);
  if (user.village < pet.unlockVillage)
    throw new GameError(`${pet.name} schließt sich dir erst auf Insel ${pet.unlockVillage} an`);

  const cost = petCost(pet, user.level);
  if (user.coins < cost) throw new GameError('Nicht genug Taler für das Futter');

  const before = petRows(user.id).find((entry) => entry.pet_id === pet.id)?.feeds ?? 0;
  const ts = now();
  const activeUntil = ts + PET_DURATION_HOURS * 3_600_000;
  user.coins -= cost;
  saveUser(user);

  const tx = db.transaction(() => {
    db.prepare('UPDATE pets SET active_until = 0 WHERE user_id = ?').run(user.id);
    db.prepare(
      `INSERT INTO pets (user_id, pet_id, active_until, feeds) VALUES (?, ?, ?, 1)
       ON CONFLICT(user_id, pet_id) DO UPDATE SET active_until = excluded.active_until, feeds = feeds + 1`,
    ).run(user.id, pet.id, activeUntil);
  });
  tx();

  const level = petLevel(before + 1);
  logEvent({ userId: user.id, type: 'pet', amount: -cost, detail: `${pet.name} gefüttert` });
  return {
    petId: pet.id,
    cost,
    secondsLeft: PET_DURATION_HOURS * 3600,
    level,
    leveledUp: level > petLevel(before),
  };
}
