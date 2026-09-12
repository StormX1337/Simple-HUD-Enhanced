import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { ApiError, api } from '../lib/api';
import { formatCoins } from '../lib/format';
import { playSound } from '../lib/sound';
import { TargetList } from './TargetList';
import { Raccoon } from './art/Raccoon';
import { DigPile } from './art/Scenery';
import { CoinIcon } from './art/HudIcons';
import type { RaidResult, TargetInfo } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function RaidOverlay({ open, onClose }: Props): JSX.Element | null {
  const { state, applyState, pushToast, refresh } = useGame();
  const [targets, setTargets] = useState<TargetInfo[]>([]);
  const [target, setTarget] = useState<TargetInfo | null>(null);
  const [result, setResult] = useState<RaidResult | null>(null);
  const [digging, setDigging] = useState<number | null>(null);
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
    setDigging(null);
    void loadTargets();
  }, [open, loadTargets]);

  if (!open || !state) return null;

  const dig = async (spotIndex: number) => {
    if (!target || busy || result) return;
    setBusy(true);
    setDigging(spotIndex);
    playSound('raid', 0.6);
    try {
      const data = await api.raid(target.id, spotIndex);
      applyState(data.state);
      window.setTimeout(() => {
        setResult(data);
        playSound(data.loot > 0 ? (data.spots[spotIndex].kind === 'jackpot' ? 'jackpot' : 'coin') : 'fail', 0.7);
      }, 650);
      if (data.levelUps > 0) playSound('levelup', 0.6);
      void refresh();
    } catch (error) {
      pushToast(error instanceof ApiError ? error.message : 'Raubzug fehlgeschlagen', 'bad');
      playSound('fail', 0.4);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const finish = () => {
    playSound('click', 0.4);
    if (state.pendingRaids > 0) {
      setTarget(null);
      setResult(null);
      setDigging(null);
      void loadTargets();
    } else {
      onClose();
    }
  };

  return (
    <div data-testid="raid-overlay" className="fixed inset-0 z-40 flex flex-col bg-[#141026]/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="font-display text-xl font-black text-bay-plum">🐾 Raubzug</div>
        <button type="button" className="btn-ghost px-3 py-1 text-sm" onClick={onClose}>
          Später
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6">
        {!target && (
          <>
            <p className="mb-2 text-center text-sm text-white/75">
              Such dir ein Versteck aus. Vier Grabstellen, ein Jackpot – Schilde helfen hier nicht.
            </p>
            <TargetList targets={targets} mode="raid" onPick={setTarget} onReload={() => void loadTargets()} busy={busy} />
          </>
        )}

        {target && (
          <div>
            <div className="panel-dark mb-3 flex items-center gap-3 p-3">
              <span className="text-3xl">{target.avatar}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-base font-bold">{target.name}</div>
                <div className="text-[11px] text-white/70">Talerlager: ≈ {formatCoins(target.estimatedLoot)}</div>
              </div>
              {!result && (
                <button type="button" className="btn-ghost px-3 py-1 text-xs" onClick={() => setTarget(null)}>
                  Anderes Ziel
                </button>
              )}
            </div>

            <p className="mb-3 text-center text-sm text-white/75">
              {result ? result.message : 'Wo hat er die Taler vergraben? Tippe eine Stelle an!'}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((index) => {
                const spot = result?.spots[index];
                const revealed = !!result;
                const picked = digging === index;
                return (
                  <button
                    key={index}
                    type="button"
                    data-testid="raid-spot"
                    disabled={busy || !!result}
                    onClick={() => void dig(index)}
                    className={`relative flex h-32 flex-col items-center justify-center overflow-hidden rounded-3xl border-4 transition-transform active:scale-95 ${
                      picked ? 'border-bay-gold' : 'border-black/30'
                    } ${revealed && !picked ? 'opacity-70' : ''}`}
                    style={{ background: 'linear-gradient(180deg,#f7e8c6 0%,#e0c38a 100%)' }}
                  >
                    {!revealed && (
                      <>
                        <motion.div
                          animate={picked ? { rotate: [0, -10, 10, 0], y: [0, -4, 0] } : {}}
                          transition={{ duration: 0.6, repeat: picked ? 1 : 0 }}
                        >
                          <DigPile size={96} />
                        </motion.div>
                        <span className="-mt-1 font-display text-sm font-black text-[#5a4020]">
                          Stelle {index + 1}
                        </span>
                      </>
                    )}
                    {revealed && spot && (
                      <motion.div
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center"
                      >
                        <div className="relative">
                          <DigPile size={92} dug />
                          {spot.amount > 0 && (
                            <span className="absolute inset-0 flex items-center justify-center gap-0.5">
                              <CoinIcon size={spot.kind === 'jackpot' ? 30 : 22} />
                              {spot.kind === 'jackpot' && <CoinIcon size={26} />}
                            </span>
                          )}
                        </div>
                        <span className="-mt-1 font-display text-sm font-black text-[#4a2f05]">
                          {spot.amount > 0 ? formatCoins(spot.amount) : 'leer'}
                        </span>
                      </motion.div>
                    )}
                    {picked && !revealed && (
                      <span className="absolute inset-0 animate-pulse bg-white/10" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="panel m-3 p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Raccoon size={54} cheer={result.loot > 0} />
              <div>
                <div className="font-display text-lg font-black">
                  {result.loot > 0 ? 'Beute gesichert!' : 'Nichts gefunden'}
                </div>
                <div className="font-display text-xl text-bay-golddark">
                  +{formatCoins(result.loot)} Taler
                </div>
              </div>
            </div>
            <button type="button" data-testid="raid-finish" className="btn-gold mt-3 w-full" onClick={finish}>
              {state.pendingRaids > 0 ? `Nächster Raubzug (${state.pendingRaids})` : 'Zurück zur Insel'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
