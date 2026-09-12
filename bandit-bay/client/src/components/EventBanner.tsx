import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { formatDuration } from '../lib/format';
import { CoinIcon } from './art/HudIcons';

/** Zeigt das laufende bzw. nächste Talerregen-Event mit Countdown. */
export function EventBanner(): JSX.Element | null {
  const { state } = useGame();
  const [seconds, setSeconds] = useState(0);

  const event = state?.event;
  useEffect(() => {
    if (!event) return;
    setSeconds(event.active ? event.secondsLeft : event.secondsUntilNext);
  }, [event]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!event) return null;

  return (
    <motion.div
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`flex items-center gap-2 rounded-2xl border-[3px] px-2.5 py-1 shadow-chunkysm ${
        event.active
          ? 'border-[#7a1a0c] bg-gradient-to-b from-[#ff9a3c] via-[#f8632c] to-[#c8301f]'
          : 'border-[#0b1830] bg-gradient-to-b from-[#33527f] to-[#182c4b]'
      }`}
    >
      <span className={`text-lg ${event.active ? 'animate-bob' : 'opacity-70'}`}>🎉</span>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-center gap-1 font-display text-[13px] font-black text-white text-outline">
          {event.name}
          <span className="flex items-center gap-0.5 rounded-full bg-black/30 px-1.5 text-[11px]">
            <CoinIcon size={12} />×{event.multiplier}
          </span>
        </div>
        <div className="truncate text-[10px] font-bold text-white/80">
          {event.active
            ? `Doppelte Taler – noch ${formatDuration(seconds)}`
            : `Nächster Talerregen in ${formatDuration(seconds)}`}
        </div>
      </div>
      {event.active && (
        <span className="rounded-full border-2 border-black/30 bg-[#ffe9a0] px-2 py-0.5 font-display text-[11px] font-black text-[#4a2f05]">
          LÄUFT
        </span>
      )}
    </motion.div>
  );
}
