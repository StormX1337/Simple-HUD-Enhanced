import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { api, ApiError } from '../lib/api';
import { formatCoins, formatDuration, formatFull } from '../lib/format';
import { playSound } from '../lib/sound';
import { useShortScreen } from '../lib/useMediaQuery';
import { BuildingArt } from './art/BuildingArt';
import { DecoArt } from './art/DecoArt';
import { Raccoon } from './art/Raccoon';
import { PetArt } from './art/PetArt';
import { CoinIcon } from './art/HudIcons';
import { Boat, Bush, Cloud, FarIsland, Palm, Rock, Sun } from './art/Scenery';
import { EventBanner } from './EventBanner';
import type { VillageDef } from '../types';

/** Plätze für Dekorationen (Prozentwerte). */
const DECO_SPOTS = [
  { x: 19, y: 68 },
  { x: 50, y: 63 },
  { x: 82, y: 68 },
];

/** Feste Bauplätze auf der Insel (Prozentwerte). */
const SPOTS = [
  { x: 26, y: 56 },
  { x: 50, y: 43 },
  { x: 74, y: 56 },
  { x: 34, y: 78 },
  { x: 66, y: 78 },
];

interface VillageProps {
  onOpenEvents?: () => void;
  onOpenVillages?: () => void;
}

export function VillageScene({ onOpenEvents, onOpenVillages }: VillageProps): JSX.Element | null {
  const { state, config, applyState, pushToast, refresh } = useGame();
  const short = useShortScreen();
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [celebrate, setCelebrate] = useState<VillageDef | null>(null);

  if (!state || !config) return null;
  const village = config.villages.find((v) => v.id === state.villageId) ?? config.villages[0];
  const progress = Math.round(state.villageProgress * 100);

  const upgrade = async (index: number) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await api.upgrade(index);
      applyState(result.state);
      playSound('upgrade');
      pushToast(`Ausgebaut auf Stufe ${result.newLevel}`, 'good');
      if (result.villageComplete) {
        const next = config.villages.find((v) => v.id === result.newVillageId);
        playSound('levelup');
        if (next) setCelebrate(next);
        setSelected(null);
      }
      if (result.levelUps > 0) playSound('levelup');
      await refresh();
    } catch (error) {
      playSound('fail', 0.4);
      pushToast(error instanceof ApiError ? error.message : 'Ausbau fehlgeschlagen', 'bad');
    } finally {
      setBusy(false);
    }
  };

  const selectedBuilding = selected === null ? null : state.buildings[selected];
  const selectedDef = selected === null ? null : village.buildings[selected];

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Himmel */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${village.palette.skyTop} 0%, ${village.palette.skyBottom} 42%)`,
        }}
      />
      <Sun size={short ? 60 : 80} className="absolute -left-3 -top-3 animate-bob" />
      <Cloud size={short ? 64 : 84} className="absolute left-[30%] top-12 animate-wave opacity-95" />
      <Cloud size={short ? 46 : 60} className="absolute right-[22%] top-24 animate-bob opacity-85" />
      <FarIsland size={short ? 60 : 76} className="absolute left-[14%] top-[36%] opacity-75" />
      <FarIsland size={short ? 48 : 62} className="absolute right-[16%] top-[38%] opacity-65" />

      {/* Meer */}
      <div className="absolute inset-x-0 bottom-0 top-[40%] bg-gradient-to-b from-[#3f9fd0] via-[#2b7fb5] to-[#17578b]" />
      <div className="pointer-events-none absolute inset-x-0 top-[46%] h-10 opacity-40">
        <div className="mx-auto h-1.5 w-[70%] animate-wave rounded-full bg-white/70" />
        <div className="ml-6 mt-2 h-1.5 w-[35%] animate-bob rounded-full bg-white/60" />
        <div className="ml-auto mr-8 mt-2 h-1.5 w-[28%] animate-wave rounded-full bg-white/50" />
      </div>
      <Boat size={short ? 34 : 44} className="absolute right-[5%] top-[43%] animate-bob" />

      {/* Insel */}
      <div className="absolute inset-x-0 bottom-0 top-[47%]">
        <div className="absolute inset-x-[3%] bottom-[-24%] top-0 rounded-[50%] bg-[#f0dca6] shadow-[0_-6px_0_rgba(255,255,255,0.35)_inset]" />
        <div
          className="absolute inset-x-[8%] bottom-[-22%] top-[7%] rounded-[50%]"
          style={{ background: village.palette.ground }}
        />
        <div
          className="absolute inset-x-[17%] bottom-[-18%] top-[16%] rounded-[50%] opacity-40"
          style={{ background: village.palette.accent }}
        />
      </div>

      {/* Bepflanzung */}
      <Palm size={short ? 34 : 46} className="absolute bottom-[13%] left-[15%]" />
      <Palm size={short ? 30 : 40} className="absolute bottom-[12%] right-[13%]" />
      <Bush size={short ? 26 : 34} className="absolute bottom-[8%] left-[47%]" />
      <Rock size={short ? 24 : 30} className="absolute bottom-[24%] right-[3%]" />
      <Bush size={short ? 22 : 28} className="absolute bottom-[26%] left-[4%]" />

      {/* Inselschild */}
      <div className="absolute inset-x-0 top-0 z-10 space-y-1.5 px-2 pt-1.5">
        <button
          type="button"
          data-testid="village-sign"
          onClick={() => {
            playSound('click', 0.35);
            onOpenVillages?.();
          }}
          className="wood-sign flex w-full items-center gap-2 px-3 py-1.5 text-left active:translate-y-[2px]">
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-sm font-black leading-tight text-[#ffe9a0] text-outline">
              Insel {village.id}: {village.name}
            </div>
            <div className="truncate text-[10px] font-bold text-[#f5dfb4]/80">{village.subtitle}</div>
          </div>
          <div className="w-24 shrink-0">
            <div className="relative h-3.5 overflow-hidden rounded-full border-2 border-[#3b2412] bg-[#2b1a0c]">
              <div
                className="h-full bg-gradient-to-r from-[#8ee06a] via-[#f8c73c] to-[#ff9a3c] transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white text-outline">
                {progress}%
              </span>
            </div>
            <div className="mt-0.5 text-center text-[9px] font-bold text-[#f5dfb4]/70">alle Inseln ▸</div>
          </div>
        </button>
        <EventBanner onOpenEvents={onOpenEvents} />
      </div>

      {/* Dekorationen */}
      {state.decorations.map((deco) => {
        const spot = DECO_SPOTS[deco.slot] ?? DECO_SPOTS[0];
        return (
          <div
            key={`${deco.slot}-${deco.id}`}
            className="pointer-events-none absolute z-[9] -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
          >
            <DecoArt art={deco.art} size={short ? 44 : 58} />
          </div>
        );
      })}

      {/* Gebäude */}
      {state.buildings.map((building, index) => {
        const def = village.buildings[index];
        const spot = SPOTS[index] ?? SPOTS[0];
        const done = building.level >= building.maxLevel;
        const affordable = state.coins >= building.cost;
        return (
          <button
            key={def.id}
            type="button"
            data-testid="building-slot"
            onClick={() => {
              playSound('click', 0.35);
              setSelected(index);
            }}
            className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-transform active:scale-95"
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
          >
            <BuildingArt
              kind={def.kind}
              level={building.level}
              accent={village.palette.accent}
              size={short ? 68 : 94}
            />
            <span
              className={`-mt-2 flex items-center gap-1 whitespace-nowrap rounded-full border-2 px-1.5 py-0.5 font-display text-[10px] font-black shadow-chunkysm ${
                done
                  ? 'border-[#7a4a05] bg-gradient-to-b from-[#ffe9a0] to-[#e0a21a] text-[#4a2f05]'
                  : affordable
                    ? 'border-[#1d4a1f] bg-gradient-to-b from-[#8ee06a] to-[#3f9a3a] text-white'
                    : 'border-black/50 bg-black/60 text-white/80'
              }`}
            >
              {done ? (
                'FERTIG ★'
              ) : (
                <>
                  <span className="opacity-80">{building.level}/{building.maxLevel}</span>
                  <CoinIcon size={12} />
                  {formatCoins(building.cost)}
                </>
              )}
            </span>
          </button>
        );
      })}

      <div className="pointer-events-none absolute bottom-[2%] left-[1%] z-10 flex items-end">
        {state.activePet && (
          <div className="relative flex flex-col items-center">
            <span className="mb-0.5 whitespace-nowrap rounded-full border-2 border-black/40 bg-black/55 px-1.5 text-[9px] font-black text-[#ffd95e]">
              {state.activePet.name} · Stufe {state.activePet.level} ·{' '}
              {formatDuration(state.activePet.secondsLeft)}
            </span>
            <PetArt art={state.activePet.art} size={short ? 40 : 52} happy className="animate-bob" />
          </div>
        )}
        <Raccoon size={short ? 58 : 80} className="-ml-3 animate-bob" />
      </div>

      {/* Ausbau-Panel */}
      <AnimatePresence>
        {selectedBuilding && selectedDef && (
          <motion.div
            className="absolute inset-0 z-20 flex items-end bg-black/50 p-2.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="panel w-full p-3"
              initial={{ y: 60 }}
              animate={{ y: 0 }}
              exit={{ y: 60 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border-2 border-black/15 bg-gradient-to-b from-[#dff0ff] to-[#bcd9f0] p-1">
                  <BuildingArt
                    kind={selectedDef.kind}
                    level={selectedBuilding.level}
                    accent={village.palette.accent}
                    size={74}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg font-black leading-tight">{selectedDef.name}</div>
                  <div className="text-xs opacity-70">
                    Stufe {selectedBuilding.level} von {selectedBuilding.maxLevel}
                  </div>
                  <div className="mt-1.5 flex gap-1">
                    {Array.from({ length: selectedBuilding.maxLevel }).map((_, index) => (
                      <span
                        key={index}
                        className={`h-3 flex-1 rounded-full border-2 ${
                          index < selectedBuilding.level
                            ? 'border-[#7a4a05] bg-gradient-to-b from-[#ffe9a0] to-[#e0a21a]'
                            : 'border-black/15 bg-black/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  className="btn border-black/20 bg-black/10 px-4 text-sm text-[#3b2a14]"
                  onClick={() => setSelected(null)}
                >
                  Zu
                </button>
                {selectedBuilding.level >= selectedBuilding.maxLevel ? (
                  <div className="flex-1 rounded-2xl border-2 border-black/20 bg-black/10 px-4 py-2 text-center font-display text-sm">
                    Vollständig ausgebaut ★
                  </div>
                ) : (
                  <button
                    type="button"
                    data-testid="upgrade-button"
                    disabled={busy || state.coins < selectedBuilding.cost}
                    className="btn-green flex flex-1 items-center justify-center gap-1.5 text-sm"
                    onClick={() => void upgrade(selectedBuilding.index)}
                  >
                    Ausbauen <CoinIcon size={18} /> {formatFull(selectedBuilding.cost)}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insel abgeschlossen */}
      <AnimatePresence>
        {celebrate && (
          <motion.div
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/65 p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="panel w-full max-w-sm p-5 text-center"
              initial={{ scale: 0.7, rotate: -4 }}
              animate={{ scale: 1, rotate: 0 }}
            >
              <div className="font-display text-2xl font-black">Insel fertig!</div>
              <Raccoon size={110} className="mx-auto my-2" cheer />
              <p className="text-sm">
                Du segelst weiter nach <b>{celebrate.name}</b>. Neue Gebäude, neue Karten, größere
                Beute!
              </p>
              <button
                type="button"
                className="btn-gold mt-4 w-full"
                onClick={() => {
                  playSound('click');
                  setCelebrate(null);
                }}
              >
                Weiter
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
