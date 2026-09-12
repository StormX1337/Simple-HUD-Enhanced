import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { ApiError, api } from '../lib/api';
import { formatCoins } from '../lib/format';
import { playSound } from '../lib/sound';
import { BuildingArt } from './art/BuildingArt';
import { TargetList } from './TargetList';
import type { AttackResult, TargetInfo } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AttackOverlay({ open, onClose }: Props): JSX.Element | null {
  const { state, config, applyState, pushToast, refresh } = useGame();
  const [targets, setTargets] = useState<TargetInfo[]>([]);
  const [target, setTarget] = useState<TargetInfo | null>(null);
  const [result, setResult] = useState<AttackResult | null>(null);
  const [hitSpot, setHitSpot] = useState<number | null>(null);
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
    void loadTargets();
  }, [open, loadTargets]);

  if (!open || !state || !config) return null;

  const village = target ? config.villages.find((v) => v.id === target.villageId) : null;

  const strike = async (spotIndex: number) => {
    if (!target || busy) return;
    setBusy(true);
    setHitSpot(spotIndex);
    playSound('attack', 0.7);
    try {
      const data = await api.attack(target.id, spotIndex);
      applyState(data.state);
      window.setTimeout(() => setResult(data), 550);
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
      void loadTargets();
    } else {
      onClose();
    }
  };

  return (
    <div data-testid="attack-overlay" className="fixed inset-0 z-40 flex flex-col bg-[#1a1020]/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="font-display text-xl font-black text-bay-coral">⚒️ Angriff</div>
        <button type="button" className="btn-ghost px-3 py-1 text-sm" onClick={onClose}>
          Später
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6">
        {!target && (
          <>
            <p className="mb-2 text-center text-sm text-white/75">
              Wähle ein Dorf. Ein Treffer beschädigt ein Gebäude – Schilde blocken den Angriff.
            </p>
            <TargetList targets={targets} mode="attack" onPick={setTarget} onReload={() => void loadTargets()} busy={busy} />
          </>
        )}

        {target && village && (
          <div>
            <div className="panel-dark mb-3 flex items-center gap-3 p-3">
              <span className="text-3xl">{target.avatar}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-base font-bold">{target.name}</div>
                <div className="text-[11px] text-white/70">
                  {village.name} · {target.shields > 0 ? `${target.shields} Schild(e)` : 'ungeschützt'}
                </div>
              </div>
              {!result && (
                <button type="button" className="btn-ghost px-3 py-1 text-xs" onClick={() => setTarget(null)}>
                  Anderes Ziel
                </button>
              )}
            </div>

            <p className="mb-2 text-center text-sm text-white/75">
              {result ? result.message : 'Tippe das Gebäude an, das du treffen willst!'}
            </p>

            <div className="grid grid-cols-3 gap-2">
              {target.buildings.map((building) => {
                const damaged = result && result.destroyed && result.spotIndex === building.index;
                const level = damaged ? Math.max(0, building.level - 1) : building.level;
                return (
                  <button
                    key={building.index}
                    type="button"
                    data-testid="attack-spot"
                    disabled={busy || !!result}
                    onClick={() => void strike(building.index)}
                    className={`panel relative flex flex-col items-center p-1.5 transition-transform active:scale-95 ${
                      hitSpot === building.index ? 'animate-shake' : ''
                    }`}
                  >
                    <BuildingArt
                      kind={building.kind}
                      level={level}
                      accent={village.palette.accent}
                      size={72}
                    />
                    <span className="w-full truncate px-0.5 text-[10px] font-bold opacity-80">
                      {building.name}
                    </span>
                    <span className="text-[10px] opacity-60">Stufe {level}</span>
                    {hitSpot === building.index && (
                      <motion.span
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 2.2, opacity: 0 }}
                        transition={{ duration: 0.7 }}
                        className="pointer-events-none absolute inset-0 flex items-center justify-center text-4xl"
                      >
                        💥
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </div>

            {target.shields > 0 && !result && (
              <div className="mt-3 rounded-2xl border-2 border-black/30 bg-black/30 p-2 text-center text-xs text-white/80">
                Achtung: {target.name} hat {target.shields} Schild(e). Der erste Treffer prallt ab.
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="panel m-3 p-4 text-center"
          >
            <div className="font-display text-lg font-black">
              {result.blocked ? '🛡️ Geblockt!' : result.destroyed ? '💥 Volltreffer!' : '💨 Daneben'}
            </div>
            <p className="mt-1 text-sm">{result.message}</p>
            <div className="mt-2 font-display text-xl text-bay-golddark">
              +{formatCoins(result.loot)} Taler
            </div>
            <button type="button" data-testid="attack-finish" className="btn-gold mt-3 w-full" onClick={finish}>
              {state.pendingAttacks > 0 ? `Nächster Angriff (${state.pendingAttacks})` : 'Zurück zur Insel'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
