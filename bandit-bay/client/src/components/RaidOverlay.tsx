import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { api, errorText } from '../lib/api';
import { formatCoins } from '../lib/format';
import { playSound } from '../lib/sound';
import { useShortScreen } from '../lib/useMediaQuery';
import { TargetList } from './TargetList';
import { Raccoon } from './art/Raccoon';
import { CoinIcon } from './art/HudIcons';
import { Boat, Cloud, DigPile, Palm, Rock, Shell } from './art/Scenery';
import type { RaidResult, TargetInfo } from '../types';

/** Grabstellen auf dem Strand (Prozentwerte). */
const DIG_SPOTS = [
  { x: 26, y: 34 },
  { x: 71, y: 30 },
  { x: 30, y: 68 },
  { x: 73, y: 64 },
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** Optionales Ziel, z. B. für Rache aus der Ereignisliste. */
  initialTargetId?: string | null;
}

export function RaidOverlay({ open, onClose, initialTargetId }: Props): JSX.Element | null {
  const { state, applyState, pushToast, refresh } = useGame();
  const short = useShortScreen();
  const [targets, setTargets] = useState<TargetInfo[]>([]);
  const [target, setTarget] = useState<TargetInfo | null>(null);
  const [result, setResult] = useState<RaidResult | null>(null);
  const [digging, setDigging] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<{ index: number; ability: string } | null>(null);
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
    setRevealed(null);
    void loadTargets();
    if (initialTargetId) {
      void api
        .target(initialTargetId)
        .then((data) => setTarget(data.target))
        .catch(() => undefined);
    }
  }, [open, loadTargets, initialTargetId]);

  // Grabstellen vorbereiten, sobald ein Ziel gewählt ist (Finas Spürnase).
  useEffect(() => {
    if (!open || !target) return;
    setRevealed(null);
    void api
      .prepareRaid(target.id)
      .then((data) => {
        if (data.revealedIndex !== null && data.abilityName) {
          setRevealed({ index: data.revealedIndex, ability: data.abilityName });
        }
      })
      .catch(() => undefined);
  }, [open, target]);

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
        playSound(
          data.loot > 0 ? (data.spots[spotIndex].kind === 'jackpot' ? 'jackpot' : 'coin') : 'fail',
          0.7,
        );
      }, 850);
      if (data.levelUps > 0) playSound('levelup', 0.6);
      void refresh();
    } catch (error) {
      pushToast(errorText(error, 'Raubzug fehlgeschlagen'), 'bad');
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
      setRevealed(null);
      void loadTargets();
    } else {
      onClose();
    }
  };

  return (
    <div data-testid="raid-overlay" className="fixed inset-0 z-40 flex flex-col bg-[#0f1026]">
      <div className="relative z-30 flex items-center justify-between px-3 pb-1.5 pt-[max(0.6rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2 font-display text-xl font-black text-[#c792ea] text-outline">
          🐾 Raubzug
          <span className="rounded-full border-2 border-black/40 bg-black/40 px-2 text-xs text-white">
            {state.pendingRaids} übrig
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
            Such dir ein Versteck aus. Vier Grabstellen, ein Jackpot – Schilde helfen hier nicht.
          </p>
          <TargetList
            targets={targets}
            mode="raid"
            onPick={setTarget}
            onReload={() => void loadTargets()}
            busy={busy}
          />
        </div>
      )}

      {target && (
        <>
          <div className="z-30 px-3">
            <div className="panel-dark flex items-center gap-2 p-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-[#f8c73c] bg-[#2b4874] text-xl">
                {target.avatar}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-sm font-black">{target.name}</div>
                <div className="flex items-center gap-1 text-[11px] text-white/70">
                  Talerlager <CoinIcon size={12} /> ≈ {formatCoins(target.estimatedLoot)}
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

          {/* Strandszene */}
          <div className="relative flex-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#7cc6fe] via-[#3f9fd0] to-[#2b7fb5]" />
            <Cloud size={72} className="absolute left-5 top-2 opacity-80" />
            <Cloud size={52} className="absolute right-8 top-8 opacity-70" />
            <Boat size={40} className="absolute right-6 top-[11%] animate-bob" />
            <div className="absolute inset-x-0 bottom-0 top-[24%] bg-gradient-to-b from-[#f2dcae] via-[#e2c68d] to-[#cfa96d]" />
            <div className="absolute inset-x-0 top-[23%] h-4 rounded-b-[50%] bg-white/50 blur-[3px]" />
            <Palm size={short ? 36 : 50} className="absolute bottom-[1%] right-[1%]" />
            <Rock size={short ? 26 : 34} className="absolute bottom-[3%] left-[30%]" />
            <Shell size={short ? 18 : 24} className="absolute bottom-[12%] left-[52%] rotate-12" />
            <Shell size={short ? 16 : 20} className="absolute top-[34%] left-[8%] -rotate-12" />
            <Shell size={short ? 15 : 19} className="absolute top-[52%] right-[10%] rotate-6" />

            {[0, 1, 2, 3].map((index) => {
              const spot = result?.spots[index];
              const shown = !!result;
              const hinted = !result && revealed?.index === index;
              const picked = digging === index;
              const position = DIG_SPOTS[index];
              return (
                <button
                  key={index}
                  type="button"
                  data-testid="raid-spot"
                  disabled={busy || shown || hinted}
                  onClick={() => void dig(index)}
                  className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-transform active:scale-95 disabled:cursor-default ${
                    revealed && !picked ? 'opacity-70' : ''
                  }`}
                  style={{ left: `${position.x}%`, top: `${position.y}%` }}
                >
                  <m.div
                    animate={picked && !shown ? { rotate: [0, -8, 8, -6, 0], y: [0, -4, 0] } : {}}
                    transition={{ duration: 0.5, repeat: picked && !shown ? Infinity : 0 }}
                    className="relative"
                  >
                    <DigPile size={short ? 92 : 116} dug={shown || hinted} />
                    {shown && spot && spot.amount > 0 && (
                      <m.span
                        initial={{ scale: 0.3, y: 10, opacity: 0 }}
                        animate={{ scale: 1, y: -6, opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center gap-0.5"
                      >
                        <CoinIcon size={spot.kind === 'jackpot' ? 34 : 24} />
                        {spot.kind === 'jackpot' && <CoinIcon size={28} />}
                      </m.span>
                    )}
                  </m.div>

                  <span
                    className={`-mt-2 rounded-full border-2 px-2 py-0.5 font-display text-[11px] font-black ${
                      shown && spot
                        ? spot.amount > 0
                          ? 'border-[#7a4a05] bg-gradient-to-b from-[#ffe9a0] to-[#e0a21a] text-[#4a2f05]'
                          : 'border-black/40 bg-black/55 text-white/80'
                        : hinted
                          ? 'border-[#ff9a3c] bg-[#ff9a3c] text-[#3b2412]'
                          : 'border-black/40 bg-black/45 text-white'
                    }`}
                  >
                    {shown && spot
                      ? spot.amount > 0
                        ? formatCoins(spot.amount)
                        : 'leer'
                      : hinted
                        ? 'leer!'
                        : `Stelle ${index + 1}`}
                  </span>

                  {/* Münzregen beim Fund */}
                  {shown && picked && spot && spot.amount > 0 && (
                    <>
                      {[...Array(7)].map((_, coin) => (
                        <m.span
                          key={coin}
                          initial={{ x: 0, y: 0, opacity: 1, scale: 0.7 }}
                          animate={{
                            x: (coin - 3) * 22,
                            y: -70 - (coin % 3) * 20,
                            opacity: 0,
                            scale: 1.1,
                          }}
                          transition={{ duration: 1, delay: coin * 0.05 }}
                          className="pointer-events-none absolute top-1/2"
                        >
                          <CoinIcon size={20} />
                        </m.span>
                      ))}
                    </>
                  )}
                </button>
              );
            })}

            <div className="pointer-events-none absolute bottom-0 left-0 z-10">
              <m.div animate={digging !== null && !result ? { y: [0, -6, 0] } : {}} transition={{ duration: 0.5, repeat: Infinity }}>
                <Raccoon size={short ? 62 : 82} cheer={!!result && result.loot > 0} />
              </m.div>
            </div>

            {!result && (
              <div className="absolute inset-x-0 bottom-2 z-20 text-center">
                <span className="rounded-full border-2 border-black/40 bg-black/60 px-3 py-1 font-display text-xs font-black text-white">
                  {revealed
                    ? `${revealed.ability}: eine Stelle ist leer!`
                    : 'Wo sind die Taler vergraben?'}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      <AnimatePresence>
        {result && (
          <m.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="panel z-30 m-2.5 p-3 text-center"
          >
            <div className="flex items-center justify-center gap-3">
              <Raccoon size={54} cheer={result.loot > 0} />
              <div>
                <div className="font-display text-lg font-black">
                  {result.loot > 0 ? 'Beute gesichert!' : 'Nichts gefunden'}
                </div>
                <div className="font-display text-2xl text-[#c98c14]">
                  +{formatCoins(result.loot)} Taler
                </div>
              </div>
            </div>
            <button
              type="button"
              data-testid="raid-finish"
              className="btn-gold mt-2.5 w-full"
              onClick={finish}
            >
              {state.pendingRaids > 0
                ? `Nächster Raubzug (${state.pendingRaids})`
                : 'Zurück zur Insel'}
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
