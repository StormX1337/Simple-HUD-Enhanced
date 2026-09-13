import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { ApiError, api } from '../lib/api';
import { formatCoins } from '../lib/format';
import { playSound } from '../lib/sound';
import { CardArt } from '../components/art/CardArt';
import { Raccoon } from '../components/art/Raccoon';
import { CardIcon, CoinIcon, ShieldIcon, SpinIcon } from '../components/art/HudIcons';
import type { CardDrop } from '../types';

export function DailyScreen(): JSX.Element {
  const { daily, setDaily, applyState, pushToast, refresh, state } = useGame();
  const [drops, setDrops] = useState<CardDrop[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const claim = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await api.claimDaily();
      applyState(data.state);
      if (data.daily) setDaily(data.daily);
      playSound('reward', 0.8);
      if (data.levelUps > 0) playSound('levelup', 0.7);
      if (data.drops && data.drops.length > 0) setDrops(data.drops);
      pushToast(`Tagesbelohnung: +${formatCoins(data.coins)} Taler`, 'good');
    } catch (error) {
      playSound('fail', 0.4);
      pushToast(error instanceof ApiError ? error.message : 'Belohnung nicht verfügbar', 'bad');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="panel-dark mb-3 flex items-center gap-3 p-3">
        <Raccoon size={64} className="animate-bob" cheer />
        <div>
          <div className="font-display text-lg font-black">Tägliche Belohnung</div>
          <div className="text-xs text-white/70">
            Serie: {daily?.streak ?? 0} Tag(e) · Komm jeden Tag wieder für größere Boni!
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {(daily?.ladder ?? []).map((step) => {
          const isNext = daily?.nextDay === step.day;
          const done = (daily?.streak ?? 0) >= step.day && !(daily?.canClaim && isNext);
          return (
            <m.div
              key={step.day}
              animate={isNext && daily?.canClaim ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.6 }}
              className={`rounded-2xl border-2 p-2 text-center ${
                isNext && daily?.canClaim
                  ? 'border-bay-gold bg-gradient-to-b from-[#fdf3dd] to-[#f0dcb4] text-[#3b2a14] shadow-glow'
                  : done
                    ? 'border-black/25 bg-[#3f9a55]/40 text-white'
                    : 'border-white/15 bg-white/10 text-white'
              }`}
            >
              <div className="font-display text-xs font-black">Tag {step.day}</div>
              <div className="mt-1 space-y-0.5 text-[11px] font-bold leading-tight">
                <div className="flex items-center justify-center gap-1">
                  <CoinIcon size={13} /> {formatCoins(step.coins)}
                </div>
                <div className="flex items-center justify-center gap-1">
                  <SpinIcon size={13} /> {step.spins}
                </div>
                {step.shields > 0 && (
                  <div className="flex items-center justify-center gap-1">
                    <ShieldIcon size={13} /> {step.shields}
                  </div>
                )}
                {step.cards > 0 && (
                  <div className="flex items-center justify-center gap-1">
                    <CardIcon size={13} /> {step.cards}
                  </div>
                )}
              </div>
              {done && <div className="mt-1 text-[11px] font-black">✓</div>}
            </m.div>
          );
        })}
      </div>

      <button
        type="button"
        className="btn-gold mt-4 w-full py-3 text-lg"
        disabled={!daily?.canClaim || busy}
        onClick={() => void claim()}
      >
        {daily?.canClaim ? `Tag ${daily.nextDay} abholen` : 'Heute schon abgeholt'}
      </button>

      <div className="panel mt-4 p-3 text-sm">
        <div className="mb-1 font-display text-base font-bold">So verdienst du mehr</div>
        <ul className="list-disc space-y-1 pl-5 text-[13px]">
          <li>Drei gleiche Symbole zahlen deutlich mehr als zwei.</li>
          <li>Der Einsatz vervielfacht jede Auszahlung – wird mit Level freigeschaltet.</li>
          <li>Schilde blocken Angriffe, aber keine Raubzüge.</li>
          <li>Komplette Kartensets geben große Bonuspakete.</li>
          <li>Höhere Inseln zahlen pro Symbol deutlich mehr Taler.</li>
        </ul>
        {state && (
          <div className="mt-2 text-[12px] opacity-70">
            Aktueller Maximaleinsatz: ×{state.maxBet} (Level {state.level})
          </div>
        )}
      </div>

      {drops && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5">
          <m.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="panel w-full max-w-sm p-4 text-center"
          >
            <div className="font-display text-lg font-black">Bonuskarten!</div>
            <div className="my-3 grid grid-cols-3 gap-2">
              {drops.map((drop, index) => (
                <div key={`${drop.card.id}-${index}`} className="rounded-xl border-2 p-1" style={{ borderColor: drop.card.color }}>
                  <CardArt art={drop.card.art} color={drop.card.color} size={56} className="mx-auto" />
                  <div className="truncate text-[10px] font-bold">{drop.card.name}</div>
                  <div className="text-[10px] font-black text-bay-golddark">
                    {drop.isNew ? 'NEU' : `+${formatCoins(drop.coins)}`}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn-gold w-full"
              onClick={() => {
                playSound('click', 0.4);
                setDrops(null);
              }}
            >
              Danke!
            </button>
          </m.div>
        </div>
      )}
    </div>
  );
}
