import { useCallback, useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { api, errorText } from '../lib/api';
import { formatCoins, formatDuration } from '../lib/format';
import { playSound } from '../lib/sound';
import { PetArt } from '../components/art/PetArt';
import { CoinIcon } from '../components/art/HudIcons';
import type { PetState } from '../types';

const EFFECT_LABEL: Record<PetState['effect'], string> = {
  raid: 'Raubzug-Beute',
  attack: 'Angriffs-Beute',
  coins: 'Taler am Automaten',
  shield: 'Schildschutz',
  cards: 'Wert doppelter Karten',
};

export function PetsScreen(): JSX.Element {
  const { state, config, applyState, pushToast } = useGame();
  const [pets, setPets] = useState<PetState[]>([]);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await api.pets();
      setPets(data.pets);
      applyState(data.state);
    } catch {
      pushToast('Begleiter konnten nicht geladen werden', 'bad');
    }
  }, [applyState, pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const feed = async (petId: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await api.feedPet(petId);
      setPets(data.pets);
      applyState(data.state);
      playSound('reward', 0.7);
      pushToast(`${data.pets.find((pet) => pet.id === petId)?.name} ist jetzt aktiv!`, 'good');
    } catch (error) {
      playSound('fail', 0.4);
      pushToast(errorText(error, 'Füttern fehlgeschlagen'), 'bad');
    } finally {
      setBusy(false);
    }
  };

  if (!state) return <div className="p-4 text-center">Lädt …</div>;

  return (
    <div className="space-y-3">
      <div className="panel-dark p-3">
        <div className="font-display text-lg font-black">Begleiter</div>
        <div className="text-xs text-white/70">
          Füttere ein Tier, dann hilft es dir {config?.petDurationHours ?? 4} Stunden lang. Es kann
          immer nur ein Begleiter aktiv sein.
        </div>
      </div>

      {pets.map((pet) => {
        const seconds = pet.active ? Math.max(0, pet.secondsLeft - tick) : 0;
        const affordable = state.coins >= pet.cost;
        return (
          <m.div
            key={pet.id}
            layout
            className={`panel flex items-center gap-3 p-3 ${pet.unlocked ? '' : 'opacity-70'}`}
          >
            <div
              className="shrink-0 rounded-2xl border-2 border-black/15 p-1"
              style={{ background: `${pet.color}33` }}
            >
              <PetArt art={pet.art} size={76} happy={pet.active} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base font-black leading-tight">{pet.name}</span>
                <span className="rounded-full bg-black/10 px-1.5 text-[11px] font-bold">{pet.animal}</span>
                {pet.active && (
                  <span className="rounded-full border border-black/25 bg-gradient-to-b from-[#8ee06a] to-[#3f9a3a] px-1.5 text-[10px] font-black text-white">
                    AKTIV
                  </span>
                )}
              </div>
              <div className="text-[11px] opacity-75">{pet.description}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                <span className="rounded-full bg-black/10 px-2 py-0.5">
                  +{Math.round(pet.bonus * 100)} % {EFFECT_LABEL[pet.effect]}
                </span>
                <span className="rounded-full border border-black/20 bg-[#f8c73c]/40 px-2 py-0.5">
                  Stufe {pet.level}/{pet.maxLevel}
                </span>
              </div>
              <div className="mt-1 rounded-xl border-2 border-black/15 bg-black/5 px-2 py-1 text-[11px]">
                <span className="font-black">✨ {pet.abilityName}:</span> {pet.abilityText}
                {pet.abilityChance > 0 && (
                  <span className="font-black"> ({Math.round(pet.abilityChance * 100)} %)</span>
                )}
              </div>
              {pet.level < pet.maxLevel && (
                <div className="mt-1 text-[10px] opacity-60">
                  Noch {pet.feedsToNextLevel}× füttern bis Stufe {pet.level + 1}
                </div>
              )}

              {!pet.unlocked ? (
                <div className="mt-2 rounded-xl border-2 border-black/15 bg-black/10 px-2 py-1 text-center text-[11px] font-bold">
                  Ab Insel {pet.unlockVillage} verfügbar
                </div>
              ) : pet.active ? (
                <div className="mt-2 rounded-xl border-2 border-[#1d4a1f] bg-gradient-to-b from-[#8ee06a] to-[#3f9a3a] px-2 py-1 text-center font-display text-[12px] font-black text-white">
                  Noch {formatDuration(seconds)} aktiv
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!affordable || busy}
                  onClick={() => void feed(pet.id)}
                  className="btn-green mt-2 flex w-full items-center justify-center gap-1.5 py-1.5 text-sm"
                >
                  Füttern <CoinIcon size={16} /> {formatCoins(pet.cost)}
                </button>
              )}
            </div>
          </m.div>
        );
      })}
    </div>
  );
}
