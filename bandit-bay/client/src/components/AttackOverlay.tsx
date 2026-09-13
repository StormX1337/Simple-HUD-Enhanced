import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { ApiError, api } from '../lib/api';
import { formatCoins } from '../lib/format';
import { playSound } from '../lib/sound';
import { useShortScreen } from '../lib/useMediaQuery';
import { ISLAND_SPOTS } from '../lib/spots';
import { BuildingArt } from './art/BuildingArt';
import { Hammer } from './art/Hammer';
import { Raccoon } from './art/Raccoon';
import { ShieldIcon } from './art/HudIcons';
import { Bush, Cloud, Palm } from './art/Scenery';
import { TargetList } from './TargetList';
import type { AttackResult, TargetInfo } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Optionales Ziel, z. B. für Rache aus der Ereignisliste. */
  initialTargetId?: string | null;
}

export function AttackOverlay({ open, onClose, initialTargetId }: Props): JSX.Element | null {
  const { state, config, applyState, pushToast, refresh } = useGame();
  const short = useShortScreen();
  const [targets, setTargets] = useState<TargetInfo[]>([]);
  const [target, setTarget] = useState<TargetInfo | null>(null);
  const [result, setResult] = useState<AttackResult | null>(null);
  const [hitSpot, setHitSpot] = useState<number | null>(null);
  const [swinging, setSwinging] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadTargets = useCallback(async () => {
    setBusy(true);
    try {
      const data = await api.targets();
      setTargets(data.targets);
    } catch {
      pushToast('Ziele konnten nicht geladen werden', 'bad');
    } finally {
      setBusy(false);
    }
  }, [pushToast]);

  useEffect(() => {
    if (!open) return;
    setTarget(null);
    setResult(null);
    setHitSpot(null);
    setSwinging(false);
    void loadTargets();
    if (initialTargetId) {
      void api
        .target(initialTargetId)
        .then((data) => setTarget(data.target))
        .catch(() => undefined);
    }
  }, [open, loadTargets, initialTargetId]);

  if (!open || !state || !config) return null;

  const village = target ? config.villages.find((v) => v.id === target.villageId) : null;

  const strike = async (spotIndex: number) => {
    if (!target || busy || result) return;
    setBusy(true);
    setHitSpot(spotIndex);
    setSwinging(true);
    playSound('attack', 0.7);
    try {
      const data = await api.attack(target.id, spotIndex);
      applyState(data.state);
      window.setTimeout(() => setResult(data), 900);
      if (data.levelUps > 0) playSound('levelup', 0.6);
      void refresh();
    } catch (error) {
      pushToast(error instanceof ApiError ? error.message : 'Angriff fehlgeschlagen', 'bad');
      playSound('fail', 0.4);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const finish = () => {
    playSound('click', 0.4);
    if (state.pendingAttacks > 0) {
      setTarget(null);
      setResult(null);
      setHitSpot(null);
      setSwinging(false);
      void loadTargets();
    } else {
      onClose();
    }
  };

  return (
    <div data-testid="attack-overlay" className="fixed inset-0 z-40 flex flex-col bg-[#160d1c]">
      <div className="relative z-30 flex items-center justify-between px-3 pb-1.5 pt-[max(0.6rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2 font-display text-xl font-black text-[#ff9a7b] text-outline">
          ⚒️ Angriff
          <span className="rounded-full border-2 border-black/40 bg-black/40 px-2 text-xs text-white">
            {state.pendingAttacks} übrig
          </span>
        </div>
        <button
          type="button"
          data-testid="overlay-close"
          className="btn-ghost px-3 py-1 text-sm"
          onClick={onClose}
        >
          Später
        </button>
      </div>

      {!target && (
        <div className="flex-1 overflow-y-auto px-3 pb-6">
          <p className="mb-2 text-center text-sm text-white/75">
            Wähle ein Dorf. Ein Treffer beschädigt ein Gebäude – Schilde blocken den Angriff.
          </p>
          <TargetList
            targets={targets}
            mode="attack"
            onPick={setTarget}
            onReload={() => void loadTargets()}
            busy={busy}
          />
        </div>
      )}

      {target && village && (
        <>
          {/* Kopf des Ziels */}
          <div className="z-30 px-3">
            <div className="panel-dark flex items-center gap-2 p-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-[#f8c73c] bg-[#2b4874] text-xl">
                {target.avatar}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-sm font-black">{target.name}</div>
                <div className="flex items-center gap-1 text-[11px] text-white/70">
                  {village.name} ·
                  {target.shields > 0 ? (
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: target.shields }).map((_, index) => (
                        <ShieldIcon key={index} size={13} />
                      ))}
                    </span>
                  ) : (
                    <span className="text-[#ff9a7b]">ungeschützt</span>
                  )}
                </div>
              </div>
              {!result && (
                <button
                  type="button"
                  className="btn-ghost px-2.5 py-1 text-xs"
                  onClick={() => setTarget(null)}
                >
                  Anderes Ziel
                </button>
              )}
            </div>
          </div>

          {/* Insel des Ziels */}
          <motion.div
            className="relative flex-1 overflow-hidden"
            animate={swinging && result ? { x: [0, -9, 9, -5, 0], y: [0, 5, -4, 0] } : {}}
            transition={{ duration: 0.45 }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, #2a3a63 0%, #4a5f93 35%, #2b7fb5 62%, #17578b 100%)`,
              }}
            />
            <Cloud size={70} className="absolute left-4 top-4 opacity-40" />
            <Cloud size={54} className="absolute right-6 top-12 opacity-30" />

            <div className="absolute inset-x-0 bottom-0 top-[42%]">
              <div className="absolute inset-x-[3%] bottom-[-24%] top-0 rounded-[50%] bg-[#c8b184]" />
              <div
                className="absolute inset-x-[8%] bottom-[-22%] top-[7%] rounded-[50%] brightness-75"
                style={{ background: village.palette.ground }}
              />
            </div>
            <Palm size={short ? 32 : 44} className="absolute bottom-[16%] left-[10%] brightness-75" />
            <Palm size={short ? 28 : 38} className="absolute bottom-[14%] right-[9%] brightness-75" />
            <Bush size={short ? 24 : 30} className="absolute bottom-[8%] left-[46%] brightness-75" />

            {target.buildings.map((building) => {
              const spot = ISLAND_SPOTS[building.index] ?? ISLAND_SPOTS[0];
              const damaged =
                (result?.destroyed && result.spotIndex === building.index) ||
                result?.secondSpotIndex === building.index;
              const level = damaged ? Math.max(0, building.level - 1) : building.level;
              const isHit = hitSpot === building.index || result?.secondSpotIndex === building.index;
              return (
                <button
                  key={building.index}
                  type="button"
                  data-testid="attack-spot"
                  disabled={busy || !!result}
                  onClick={() => void strike(building.index)}
                  className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-transform active:scale-95 disabled:cursor-default"
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                >
                  <motion.div
                    animate={isHit && result ? { rotate: [0, -6, 6, -3, 0], scale: [1, 0.94, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <BuildingArt
                      kind={building.kind}
                      level={level}
                      accent={village.palette.accent}
                      size={short ? 66 : 88}
                    />
                  </motion.div>
                  <span className="-mt-1.5 max-w-[92px] truncate rounded-full border-2 border-black/40 bg-black/55 px-1.5 text-[10px] font-black text-white">
                    {building.name}
                  </span>

                  {/* Einschlag */}
                  <AnimatePresence>
                    {isHit && (
                      <>
                        <motion.div
                          initial={{ rotate: -75, x: 40, y: -70, opacity: 0 }}
                          animate={{ rotate: 18, x: 10, y: -18, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 260, damping: 12 }}
                          className="pointer-events-none absolute -top-10 left-1/2 origin-bottom"
                        >
                          <Hammer size={short ? 64 : 84} />
                        </motion.div>
                        {result && (
                          <motion.span
                            initial={{ scale: 0.2, opacity: 1 }}
                            animate={{ scale: 2.4, opacity: 0 }}
                            transition={{ duration: 0.8 }}
                            className="pointer-events-none absolute inset-0 flex items-center justify-center text-5xl"
                          >
                            {result.blocked ? '🛡️' : '💥'}
                          </motion.span>
                        )}
                        {result && !result.blocked && (
                          <>
                            {[...Array(6)].map((_, index) => (
                              <motion.span
                                key={index}
                                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                animate={{
                                  x: (index - 2.5) * 26,
                                  y: -40 - (index % 3) * 18,
                                  opacity: 0,
                                  scale: 0.4,
                                }}
                                transition={{ duration: 0.9 }}
                                className="pointer-events-none absolute h-3 w-3 rounded-sm bg-[#d8b880]"
                              />
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}

            {/* Schildkuppel */}
            {target.shields > 0 && !result && (
              <div className="pointer-events-none absolute inset-x-[6%] bottom-0 top-[36%] rounded-t-[50%] border-t-4 border-[#8ee06a]/50 bg-[#8ee06a]/10" />
            )}

            <div className="pointer-events-none absolute bottom-1 right-1 z-10">
              <Raccoon size={short ? 54 : 70} cheer={!!result && !result.blocked} />
            </div>

            {!result && (
              <div className="absolute inset-x-0 bottom-2 z-20 text-center">
                <span className="rounded-full border-2 border-black/40 bg-black/60 px-3 py-1 font-display text-xs font-black text-white">
                  Tippe ein Gebäude an!
                </span>
              </div>
            )}
          </motion.div>
        </>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="panel z-30 m-2.5 p-3 text-center"
          >
            <div className="font-display text-lg font-black">
              {result.blocked
                ? '🛡️ Geblockt!'
                : result.secondSpotIndex !== null
                  ? '💥💥 Doppelschlag!'
                  : result.destroyed
                    ? '💥 Volltreffer!'
                    : '💨 Daneben'}
            </div>
            <p className="mt-0.5 text-sm">{result.message}</p>
            <div className="mt-1 font-display text-2xl text-[#c98c14]">
              +{formatCoins(result.loot)} Taler
            </div>
            <button
              type="button"
              data-testid="attack-finish"
              className="btn-gold mt-2.5 w-full"
              onClick={finish}
            >
              {state.pendingAttacks > 0
                ? `Nächster Angriff (${state.pendingAttacks})`
                : 'Zurück zur Insel'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
