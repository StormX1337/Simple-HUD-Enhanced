import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { ApiError, api } from '../lib/api';
import { formatCoins } from '../lib/format';
import { playSound } from '../lib/sound';
import { useShortScreen } from '../lib/useMediaQuery';
import { SymbolIcon } from './art/SymbolIcon';
import { SpinIcon } from './art/HudIcons';
import type { CardDef, SpinResult, SymbolId } from '../types';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

interface Props {
  onAttack: () => void;
  onRaid: () => void;
  onCard: (card: CardDef, isNew: boolean) => void;
}

export function SlotMachine({ onAttack, onRaid, onCard }: Props): JSX.Element | null {
  const { state, config, applyState, pushToast, refresh } = useGame();
  const short = useShortScreen();
  const reelHeight = short ? 74 : 94;
  const symbolSize = short ? 56 : 72;
  const [reels, setReels] = useState<SymbolId[]>(['taler', 'truhe', 'schild']);
  const [spinning, setSpinning] = useState<boolean[]>([false, false, false]);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [auto, setAuto] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const symbolIds: SymbolId[] = config?.symbols.map((symbol) => symbol.id) ?? [];

  const doSpin = useCallback(async () => {
    if (busy.current || !state) return;
    if (state.spins < state.bet) {
      setAuto(false);
      pushToast('Nicht genug Drehungen – warte auf Nachschub', 'bad');
      playSound('fail', 0.4);
      return;
    }
    busy.current = true;
    setResult(null);
    setSpinning([true, true, true]);
    playSound('spin', 0.5);

    try {
      const data = await api.spin(state.bet);
      await wait(700);
      for (let index = 0; index < 3; index++) {
        if (!mounted.current) return;
        setReels((current) => {
          const next = [...current];
          next[index] = data.reels[index];
          return next;
        });
        setSpinning((current) => {
          const next = [...current];
          next[index] = false;
          return next;
        });
        playSound('reel', 0.45);
        await wait(index === 2 ? 260 : 380);
      }
      if (!mounted.current) return;

      applyState(data.state);
      setResult(data);

      switch (data.outcome) {
        case 'coins':
          playSound(data.matches === 3 ? 'jackpot' : 'coin', 0.6);
          break;
        case 'spins':
          playSound('spins', 0.6);
          break;
        case 'shield':
          playSound('shield', 0.6);
          break;
        case 'attack':
          playSound('attack', 0.6);
          break;
        case 'raid':
          playSound('raid', 0.6);
          break;
        case 'card':
          playSound('card', 0.6);
          break;
        default:
          break;
      }
      if (data.levelUps > 0) {
        playSound('levelup', 0.7);
        pushToast(`Level ${data.state.level} erreicht!`, 'good');
      }

      if (data.outcome === 'card' && data.card) {
        setAuto(false);
        onCard(data.card, !!data.cardIsNew);
      }
      if (data.outcome === 'attack') {
        setAuto(false);
        await wait(500);
        if (mounted.current) onAttack();
      }
      if (data.outcome === 'raid') {
        setAuto(false);
        await wait(500);
        if (mounted.current) onRaid();
      }
    } catch (error) {
      setSpinning([false, false, false]);
      setAuto(false);
      playSound('fail', 0.4);
      pushToast(error instanceof ApiError ? error.message : 'Drehung fehlgeschlagen', 'bad');
      void refresh();
    } finally {
      busy.current = false;
    }
  }, [state, applyState, pushToast, onAttack, onRaid, onCard, refresh]);

  useEffect(() => {
    if (!auto || !state) return undefined;
    if (state.spins < state.bet) {
      setAuto(false);
      return undefined;
    }
    const timer = window.setTimeout(() => {
      if (!busy.current) void doSpin();
    }, 900);
    return () => window.clearTimeout(timer);
  }, [auto, state, doSpin, result]);

  if (!state || !config) return null;

  const tiers = config.balance.betTiers.filter((tier) => tier <= state.maxBet);
  const tierIndex = Math.max(0, tiers.indexOf(state.bet));

  const changeBet = async (delta: number) => {
    const next = tiers[Math.min(tiers.length - 1, Math.max(0, tierIndex + delta))];
    if (!next || next === state.bet) return;
    playSound('click', 0.35);
    try {
      const data = await api.setBet(next);
      applyState(data.state);
    } catch {
      pushToast('Einsatz konnte nicht geändert werden', 'bad');
    }
  };

  const anySpinning = spinning.some(Boolean);
  const bigWin = !!result && result.matches === 3;
  const spinPercent = Math.min(100, (state.spins / state.spinCapacity) * 100);

  return (
    <section className="relative z-20 shrink-0 px-2 pb-1">
      {/* Gewinnbanner */}
      <AnimatePresence>
        {result && result.outcome !== 'nothing' && (
          <motion.div
            key={`${result.outcome}-${result.amount}-${result.message}`}
            initial={{ opacity: 0, y: 14, scale: 0.8 }}
            animate={{ opacity: 1, y: -10, scale: 1 }}
            exit={{ opacity: 0, y: -26, scale: 0.9 }}
            className="pointer-events-none absolute -top-4 left-1/2 z-30 -translate-x-1/2 rounded-full border-[3px] border-[#7a4a05] bg-gradient-to-b from-[#ffe9a0] via-[#f8c73c] to-[#e0a21a] px-5 py-1.5 font-display text-base font-black text-[#4a2f05] shadow-[0_4px_0_rgba(0,0,0,0.35),0_0_22px_rgba(248,199,60,0.7)]"
          >
            {result.outcome === 'coins' && `+${formatCoins(result.amount)} TALER`}
            {result.outcome === 'spins' && `+${result.amount} DREHUNGEN`}
            {result.outcome === 'shield' && 'SCHILD ERHALTEN!'}
            {result.outcome === 'attack' && 'ANGRIFF BEREIT!'}
            {result.outcome === 'raid' && 'RAUBZUG BEREIT!'}
            {result.outcome === 'card' && (result.cardIsNew ? 'NEUE KARTE!' : 'KARTE DOPPELT')}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gehäuse */}
      <div className="cabinet relative rounded-[26px] p-2 pt-2.5">
        <Rivets />

        {/* Walzenkasten */}
        <div className="relative rounded-[18px] border-[3px] border-[#f8c73c] bg-[#1b0f05] p-1.5 shadow-[inset_0_4px_12px_rgba(0,0,0,0.8)]">
          <div className="flex items-stretch gap-1.5">
            {reels.map((symbol, index) => (
              <div
                key={index}
                style={{ height: reelHeight }}
                className="reel-window relative flex-1 overflow-hidden rounded-xl border-2 border-[#8a5c1c] bg-gradient-to-b from-[#fff6e2] via-[#f6e7c8] to-[#e2cda2]"
              >
                {spinning[index] ? (
                  <div
                    className="reel-strip reel-spinning"
                    style={
                      {
                        '--reel-duration': `${0.28 + index * 0.05}s`,
                        '--reel-distance': `-${symbolIds.length * reelHeight}px`,
                      } as React.CSSProperties
                    }
                  >
                    {[...symbolIds, ...symbolIds].map((id, position) => (
                      <div
                        key={`${id}-${position}`}
                        style={{ height: reelHeight }}
                        className="flex items-center justify-center"
                      >
                        <SymbolIcon id={id} size={symbolSize} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <SymbolIcon
                      id={symbol}
                      size={symbolSize}
                      className={bigWin ? 'animate-pop' : ''}
                    />
                  </div>
                )}
                {/* Glasspiegelung */}
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/55 via-transparent to-black/15" />
              </div>
            ))}
          </div>

          {/* Gewinnlinie */}
          {bigWin && (
            <motion.span
              initial={{ opacity: 0, scaleX: 0.4 }}
              animate={{ opacity: 1, scaleX: 1 }}
              className="pointer-events-none absolute inset-x-2 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#fff6d0] shadow-[0_0_14px_6px_rgba(248,199,60,0.75)]"
            />
          )}
        </div>

        {/* Einsatz */}
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            className="knob"
            disabled={tierIndex <= 0 || anySpinning}
            onClick={() => void changeBet(-1)}
            aria-label="Einsatz senken"
          >
            −
          </button>
          <div className="flex h-9 flex-1 items-center justify-center gap-2 rounded-full border-[3px] border-[#f8c73c] bg-[#1b0f05] px-3 font-display text-sm font-black text-[#ffd95e] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
            EINSATZ ×{state.bet}
            <span className="text-[10px] font-bold text-white/45">max ×{state.maxBet}</span>
          </div>
          <button
            type="button"
            className="knob"
            disabled={tierIndex >= tiers.length - 1 || anySpinning}
            onClick={() => void changeBet(1)}
            aria-label="Einsatz erhöhen"
          >
            +
          </button>
        </div>
      </div>

      {/* Offene Aktionen */}
      {(state.pendingAttacks > 0 || state.pendingRaids > 0) && (
        <div className="mt-1.5 flex gap-2">
          {state.pendingAttacks > 0 && (
            <button type="button" className="btn-red flex-1 animate-pop py-1.5 text-sm" onClick={onAttack}>
              ⚒️ Angriff ({state.pendingAttacks})
            </button>
          )}
          {state.pendingRaids > 0 && (
            <button
              type="button"
              className="btn flex-1 animate-pop bg-gradient-to-b from-[#c792ea] to-[#7d51c9] py-1.5 text-sm text-white"
              onClick={onRaid}
            >
              🐾 Raubzug ({state.pendingRaids})
            </button>
          )}
        </div>
      )}

      {/* Drehungs-Anzeige */}
      <div className="relative mx-auto mt-1.5 h-6 w-[78%] overflow-hidden rounded-full border-[3px] border-[#0b1830] bg-[#0f2038] shadow-chunkysm">
        <div
          className="h-full bg-gradient-to-r from-[#48a6f0] to-[#7fd8ff] transition-[width] duration-500"
          style={{ width: `${spinPercent}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center gap-1 font-display text-xs font-black text-white text-outline">
          <SpinIcon size={15} />
          {state.spins} / {state.spinCapacity}
        </span>
      </div>

      {/* Dreh-Button */}
      <div className="mt-1.5 flex items-end gap-2">
        <button
          type="button"
          onClick={() => {
            setAuto((current) => !current);
            playSound('click', 0.35);
          }}
          className={`flex h-[52px] w-[62px] shrink-0 flex-col items-center justify-center rounded-2xl border-[3px] font-display text-[11px] font-black leading-tight shadow-chunkysm active:translate-y-[3px] ${
            auto
              ? 'border-[#1d4a1f] bg-gradient-to-b from-[#8ee06a] to-[#3f9a3a] text-white'
              : 'border-[#0b1830] bg-gradient-to-b from-[#33527f] to-[#1a2f4f] text-white/80'
          }`}
        >
          AUTO
          <span className="text-[10px] font-bold opacity-80">{auto ? 'an' : 'aus'}</span>
        </button>

        <div className="relative flex-1">
          {!anySpinning && state.spins >= state.bet && (
            <span className="pointer-events-none absolute -inset-2 animate-pulse rounded-full bg-[#ff6b5b]/35 blur-xl" />
          )}
          <button
            type="button"
            data-testid="spin-button"
            onClick={() => void doSpin()}
            disabled={anySpinning || state.spins < state.bet}
            className="spin-button relative h-[52px] w-full overflow-hidden rounded-full font-display text-2xl font-black tracking-wide text-white disabled:opacity-60"
          >
            <span className="relative z-10 drop-shadow-[0_2px_0_rgba(0,0,0,0.45)]">
              DREHEN
              <span className="ml-2 align-middle text-xs font-bold opacity-90">−{state.bet}</span>
            </span>
            {!anySpinning && state.spins >= state.bet && (
              <span className="absolute inset-y-0 -left-1/3 w-1/3 animate-shine bg-white/30 blur-[2px]" />
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

/** Goldene Nieten an den Ecken des Gehäuses. */
function Rivets(): JSX.Element {
  return (
    <>
      {[
        'left-1.5 top-1.5',
        'right-1.5 top-1.5',
        'bottom-1.5 left-1.5',
        'bottom-1.5 right-1.5',
      ].map((position) => (
        <span
          key={position}
          className={`pointer-events-none absolute ${position} h-3 w-3 rounded-full border-2 border-[#7a4a05] bg-gradient-to-b from-[#ffe9a0] to-[#e0a21a]`}
        />
      ))}
    </>
  );
}
