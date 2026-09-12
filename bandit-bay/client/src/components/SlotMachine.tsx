import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { ApiError, api } from '../lib/api';
import { formatCoins } from '../lib/format';
import { playSound } from '../lib/sound';
import { useShortScreen } from '../lib/useMediaQuery';
import { SymbolIcon } from './art/SymbolIcon';
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
  const reelHeight = short ? 68 : 86;
  const symbolSize = short ? 50 : 62;
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

  // Automatisches Drehen
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

  return (
    <section className="relative z-20 shrink-0 border-t-4 border-black/40 bg-gradient-to-b from-[#8b5a2b] to-[#5d3a18] px-3 pb-2 pt-2 shadow-[0_-6px_18px_rgba(0,0,0,0.35)]">
      {/* Gewinnanzeige */}
      <AnimatePresence>
        {result && result.outcome !== 'nothing' && (
          <motion.div
            key={`${result.outcome}-${result.amount}-${result.message}`}
            initial={{ opacity: 0, y: 10, scale: 0.85 }}
            animate={{ opacity: 1, y: -6, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="pointer-events-none absolute -top-9 left-1/2 z-30 -translate-x-1/2 rounded-2xl border-2 border-black/30 bg-gradient-to-b from-[#ffd95e] to-[#e0a21a] px-4 py-1.5 font-display text-sm font-black text-[#4a2f05] shadow-chunkysm"
          >
            {result.outcome === 'coins' && `+${formatCoins(result.amount)} Taler`}
            {result.outcome === 'spins' && `+${result.amount} Drehungen`}
            {result.outcome === 'shield' && 'Schild erhalten!'}
            {result.outcome === 'attack' && 'Angriff bereit!'}
            {result.outcome === 'raid' && 'Raubzug bereit!'}
            {result.outcome === 'card' && (result.cardIsNew ? 'Neue Karte!' : 'Karte doppelt')}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Walzen */}
      <div className="flex items-stretch gap-2 rounded-3xl border-4 border-[#3c2410] bg-gradient-to-b from-[#2a1a0c] to-[#402713] p-2 shadow-inner">
        {reels.map((symbol, index) => (
          <div
            key={index}
            style={{ height: reelHeight }}
            className="reel-window relative flex-1 rounded-2xl border-2 border-[#c08b53]/60 bg-gradient-to-b from-[#fff8e7] to-[#e7d6b4]"
          >
            {spinning[index] ? (
              <div
                className="reel-strip reel-spinning"
                style={
                  {
                    '--reel-duration': `${0.3 + index * 0.05}s`,
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
                  className={result && result.matches === 3 ? 'animate-pop' : ''}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Einsatz */}
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          className="btn-ghost h-9 w-10 px-0 py-0 text-base"
          disabled={tierIndex <= 0 || anySpinning}
          onClick={() => void changeBet(-1)}
          aria-label="Einsatz senken"
        >
          −
        </button>
        <div className="flex-1 rounded-2xl border-2 border-black/30 bg-black/30 py-1 text-center font-display text-sm font-black text-bay-gold">
          EINSATZ ×{state.bet}
          <span className="ml-2 text-[11px] font-bold text-white/60">max ×{state.maxBet}</span>
        </div>
        <button
          type="button"
          className="btn-ghost h-9 w-10 px-0 py-0 text-base"
          disabled={tierIndex >= tiers.length - 1 || anySpinning}
          onClick={() => void changeBet(1)}
          aria-label="Einsatz erhöhen"
        >
          +
        </button>
      </div>

      {/* Aktionen aus dem Automaten */}
      {(state.pendingAttacks > 0 || state.pendingRaids > 0) && (
        <div className="mt-2 flex gap-2">
          {state.pendingAttacks > 0 && (
            <button type="button" className="btn-red flex-1 animate-pop text-sm" onClick={onAttack}>
              ⚒️ Angriff starten ({state.pendingAttacks})
            </button>
          )}
          {state.pendingRaids > 0 && (
            <button
              type="button"
              className="btn-blue flex-1 animate-pop bg-gradient-to-b from-[#c792ea] to-[#8d7ae6] text-sm text-white"
              onClick={onRaid}
            >
              🐾 Raubzug starten ({state.pendingRaids})
            </button>
          )}
        </div>
      )}

      {/* Dreh-Button */}
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setAuto((current) => !current);
            playSound('click', 0.35);
          }}
          className={`btn h-14 w-20 px-0 text-xs leading-tight ${
            auto
              ? 'bg-gradient-to-b from-[#7fd88a] to-[#3f9a55] text-[#0f2d17]'
              : 'border-white/25 bg-white/10 text-white'
          }`}
        >
          AUTO
          <br />
          {auto ? 'an' : 'aus'}
        </button>
        <button
          type="button"
          data-testid="spin-button"
          onClick={() => void doSpin()}
          disabled={anySpinning || state.spins < state.bet}
          className="btn relative h-14 flex-1 overflow-hidden bg-gradient-to-b from-[#ff6b5b] to-[#c8301f] text-xl font-black text-white"
        >
          <span className="relative z-10">
            DREHEN
            <span className="ml-2 text-xs font-bold opacity-90">−{state.bet} 🎰</span>
          </span>
          {!anySpinning && state.spins >= state.bet && (
            <span className="absolute inset-y-0 -left-1/3 w-1/3 animate-shine bg-white/25 blur-sm" />
          )}
        </button>
      </div>
      <div className="mt-1 text-center text-[11px] text-white/60">
        {state.spins} / {state.spinCapacity} Drehungen · Beute wächst mit Level & Insel
      </div>
    </section>
  );
}
