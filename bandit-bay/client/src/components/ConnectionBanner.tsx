import { useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { playSound } from '../lib/sound';

/** Zeigt an, wenn der Server nicht antwortet, und bietet einen neuen Versuch. */
export function ConnectionBanner(): JSX.Element {
  const { online, refresh } = useGame();
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    if (retrying) return;
    setRetrying(true);
    playSound('click', 0.35);
    await refresh();
    setRetrying(false);
  };

  return (
    <AnimatePresence>
      {!online && (
        <m.div
          data-testid="connection-banner"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed inset-x-0 top-0 z-[70] mx-auto flex w-full max-w-[480px] items-center gap-2 border-b-4 border-[#7a1a0c] bg-gradient-to-b from-[#ff8a6b] to-[#c8301f] px-3 py-2 shadow-chunkysm"
        >
          <span className="text-xl">📡</span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="font-display text-sm font-black text-white">Keine Verbindung</div>
            <div className="text-[11px] text-white/85">
              Läuft der Server noch? Starte ihn mit <b>npm run dev</b> neu.
            </div>
          </div>
          <button
            type="button"
            data-testid="connection-retry"
            onClick={() => void retry()}
            className="btn shrink-0 border-black/30 bg-white/90 px-3 py-1 text-xs text-[#3b2a14]"
          >
            {retrying ? '…' : 'Neu versuchen'}
          </button>
        </m.div>
      )}
    </AnimatePresence>
  );
}
