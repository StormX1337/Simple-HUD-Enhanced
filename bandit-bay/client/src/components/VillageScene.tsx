import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { api, ApiError } from '../lib/api';
import { formatCoins, formatFull } from '../lib/format';
import { playSound } from '../lib/sound';
import { useShortScreen } from '../lib/useMediaQuery';
import { BuildingArt } from './art/BuildingArt';
import { Raccoon } from './art/Raccoon';
import type { VillageDef } from '../types';

/** Feste Bauplaetze auf der Insel (Prozentwerte). */
const SPOTS = [
  { x: 20, y: 45 },
  { x: 50, y: 33 },
  { x: 79, y: 46 },
  { x: 33, y: 70 },
  { x: 68, y: 70 },
];

export function VillageScene(): JSX.Element | null {
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
      {/* Himmel & Meer */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${village.palette.skyTop} 0%, ${village.palette.skyBottom} 55%, #2f6f9e 55%, #1d4f78 100%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-between px-6 opacity-80">
        <div className="animate-wave text-3xl">☁️</div>
        <div className="animate-bob text-2xl">☁️</div>
      </div>

      {/* Wellen */}
      <div className="pointer-events-none absolute inset-x-0 top-[50%] flex justify-around text-lg opacity-30">
        <span className="animate-wave">〰️</span>
        <span className="animate-bob">〰️</span>
        <span className="animate-wave">〰️</span>
      </div>

      {/* Insel */}
      <div className="absolute inset-x-0 bottom-0 top-[26%]">
        <div className="absolute inset-x-0 bottom-[-16%] top-0 rounded-[50%] bg-[#f3dfae]" />
        <div
          className="absolute inset-x-4 bottom-[-14%] top-[5%] rounded-[50%]"
          style={{ background: village.palette.ground }}
        />
        <div
          className="absolute inset-x-12 bottom-[-10%] top-[12%] rounded-[50%] opacity-45"
          style={{ background: village.palette.accent }}
        />
      </div>

      {/* Kopfzeile mit Fortschritt */}
      <div className="absolute inset-x-0 top-0 z-10 px-3 pt-2">
        <div className="panel-dark flex items-center gap-3 rounded-2xl px-3 py-2">
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-base font-bold leading-tight">
              Insel {village.id}: {village.name}
            </div>
            <div className="truncate text-[11px] text-white/70">{village.subtitle}</div>
          </div>
          <div className="w-24">
            <div className="h-3 overflow-hidden rounded-full border border-black/40 bg-black/40">
              <div
                className="h-full bg-gradient-to-r from-[#ffd95e] to-[#e0a21a] transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-0.5 text-center text-[10px] font-bold">{progress}%</div>
          </div>
        </div>
      </div>

      {/* Gebaeude */}
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
              size={short ? 66 : 92}
            />
            <span
              className={`-mt-2 whitespace-nowrap rounded-full border-2 border-black/30 px-1.5 py-0.5 font-display text-[10px] font-black shadow-chunkysm ${
                done
                  ? 'bg-gradient-to-b from-[#ffd95e] to-[#e0a21a] text-[#4a2f05]'
                  : affordable
                    ? 'bg-gradient-to-b from-[#7fd88a] to-[#3f9a55] text-[#0f2d17]'
                    : 'bg-black/55 text-white/80'
              }`}
            >
              {done ? 'FERTIG' : `${building.level}/${building.maxLevel} · ${formatCoins(building.cost)}`}
            </span>
          </button>
        );
      })}

      <div className="pointer-events-none absolute bottom-1 left-2 z-10">
        <Raccoon size={short ? 52 : 78} className="animate-bob" />
      </div>

      {/* Ausbau-Panel */}
      <AnimatePresence>
        {selectedBuilding && selectedDef && (
          <motion.div
            className="absolute inset-0 z-20 flex items-end bg-black/45 p-3"
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
                <BuildingArt
                  kind={selectedDef.kind}
                  level={selectedBuilding.level}
                  accent={village.palette.accent}
                  size={72}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg font-bold leading-tight">{selectedDef.name}</div>
                  <div className="text-xs opacity-70">
                    Stufe {selectedBuilding.level} von {selectedBuilding.maxLevel}
                  </div>
                  <div className="mt-1 flex gap-1">
                    {Array.from({ length: selectedBuilding.maxLevel }).map((_, index) => (
                      <span
                        key={index}
                        className={`h-2.5 flex-1 rounded-full border border-black/20 ${
                          index < selectedBuilding.level ? 'bg-bay-gold' : 'bg-black/15'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  className="btn-ghost flex-1 border-black/20 bg-black/10 text-sm text-[#3b2a14]"
                  onClick={() => setSelected(null)}
                >
                  Schließen
                </button>
                {selectedBuilding.level >= selectedBuilding.maxLevel ? (
                  <div className="flex-[2] rounded-2xl border-2 border-black/20 bg-black/10 px-4 py-2 text-center font-display text-sm">
                    Vollständig ausgebaut
                  </div>
                ) : (
                  <button
                    type="button"
                    data-testid="upgrade-button"
                    disabled={busy || state.coins < selectedBuilding.cost}
                    className="btn-green flex-[2] text-sm"
                    onClick={() => void upgrade(selectedBuilding.index)}
                  >
                    Ausbauen · 🪙 {formatFull(selectedBuilding.cost)}
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
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-5"
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
