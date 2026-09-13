import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { formatDuration } from '../lib/format';

interface Props {
  onOpenEvents?: () => void;
}

/** Zeigt das laufende bzw. nächste Event mit Countdown. */
export function EventBanner({ onOpenEvents }: Props): JSX.Element | null {
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
    <m.button
      type="button"
      data-testid="event-banner"
      onClick={onOpenEvents}
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`flex w-full items-center gap-2 rounded-2xl border-[3px] px-2.5 py-1 text-left shadow-chunkysm active:translate-y-[2px] ${
        event.active ? 'border-[#7a1a0c]' : 'border-[#0b1830]'
      }`}
      style={{
        background: event.active
          ? `linear-gradient(180deg, ${event.color}, #c8301f)`
          : 'linear-gradient(180deg, #33527f, #182c4b)',
      }}
    >
      <span className={`text-lg ${event.active ? 'animate-bob' : 'opacity-70'}`}>{event.icon}</span>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-center gap-1 font-display text-[13px] font-black text-white text-outline">
          {event.name}
          <span className="rounded-full bg-black/30 px-1.5 text-[10px]">{event.short}</span>
        </div>
        <div className="truncate text-[10px] font-bold text-white/80">
          {event.active
            ? `Noch ${formatDuration(seconds)} – danach ${event.nextName}`
            : `${event.name} startet in ${formatDuration(seconds)}`}
        </div>
      </div>
      <span
        className={`rounded-full border-2 border-black/30 px-2 py-0.5 font-display text-[11px] font-black ${
          event.active ? 'bg-[#ffe9a0] text-[#4a2f05]' : 'bg-black/30 text-white/80'
        }`}
      >
        {event.active ? 'LÄUFT' : 'PLAN'}
      </span>
    </m.button>
  );
}
