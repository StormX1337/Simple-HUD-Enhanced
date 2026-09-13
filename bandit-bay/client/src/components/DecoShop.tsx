import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { ApiError, api } from '../lib/api';
import { formatCoins } from '../lib/format';
import { playSound } from '../lib/sound';
import { DecoArt } from './art/DecoArt';
import { CoinIcon } from './art/HudIcons';
import type { DecoState } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Deko-Laden: drei Plätze pro Insel, jede Deko kostet Taler. */
export function DecoShop({ open, onClose }: Props): JSX.Element | null {
  const { state, applyState, pushToast } = useGame();
  const [decorations, setDecorations] = useState<DecoState | null>(null);
  const [slot, setSlot] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.decorations();
      setDecorations(data.decorations);
    } catch {
      pushToast('Deko konnte nicht geladen werden', 'bad');
    }
  }, [pushToast]);

  useEffect(() => {
    if (!open) return;
    setSlot(0);
    void load();
  }, [open, load]);

  if (!open || !state) return null;

  const buy = async (decoId: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await api.buyDecoration(slot, decoId);
      setDecorations(data.decorations);
      applyState(data.state);
      playSound('upgrade', 0.7);
      pushToast(`${data.decorations.placed.find((entry) => entry.slot === slot)?.name ?? 'Deko'} aufgestellt`, 'good');
    } catch (error) {
      playSound('fail', 0.4);
      pushToast(error instanceof ApiError ? error.message : 'Kauf fehlgeschlagen', 'bad');
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await api.removeDecoration(slot);
      setDecorations(data.decorations);
      applyState(data.state);
      playSound('click', 0.4);
    } catch {
      pushToast('Entfernen fehlgeschlagen', 'bad');
    } finally {
      setBusy(false);
    }
  };

  const current = decorations?.placed.find((entry) => entry.slot === slot) ?? null;

  return (
    <AnimatePresence>
      <m.div
        className="fixed inset-0 z-50 flex items-end bg-black/60 p-2.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <m.div
          className="panel max-h-[80vh] w-full overflow-y-auto p-3"
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          exit={{ y: 80 }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="font-display text-lg font-black leading-tight">Insel schmücken</div>
              <div className="text-[11px] opacity-70">
                Drei Plätze pro Insel – Deko bleibt dauerhaft stehen.
              </div>
            </div>
            <button
              type="button"
              data-testid="deco-close"
              className="btn border-black/20 bg-black/10 px-3 py-1 text-sm text-[#3b2a14]"
              onClick={onClose}
            >
              Fertig
            </button>
          </div>

          {/* Platzwahl */}
          <div className="mt-2 flex gap-1.5">
            {Array.from({ length: decorations?.slots ?? 3 }).map((_, index) => {
              const placed = decorations?.placed.find((entry) => entry.slot === index);
              return (
                <button
                  key={index}
                  type="button"
                  data-testid={`deco-slot-${index}`}
                  onClick={() => {
                    playSound('click', 0.3);
                    setSlot(index);
                  }}
                  className={`flex flex-1 flex-col items-center rounded-2xl border-[3px] p-1.5 ${
                    slot === index
                      ? 'border-[#7a4a05] bg-gradient-to-b from-[#ffe9a0] to-[#e0a21a]'
                      : 'border-black/20 bg-black/5'
                  }`}
                >
                  {placed ? (
                    <DecoArt art={placed.art} size={44} />
                  ) : (
                    <span className="flex h-11 w-11 items-center justify-center text-2xl opacity-40">＋</span>
                  )}
                  <span className="mt-0.5 text-[10px] font-black">Platz {index + 1}</span>
                </button>
              );
            })}
          </div>

          {current && (
            <button
              type="button"
              className="btn mt-2 w-full border-black/20 bg-black/10 py-1.5 text-xs text-[#3b2a14]"
              onClick={() => void clear()}
            >
              „{current.name}" von Platz {slot + 1} entfernen
            </button>
          )}

          {/* Angebot */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(decorations?.offers ?? []).map((offer) => {
              const affordable = state.coins >= offer.cost;
              const isPlaced = current?.id === offer.id;
              return (
                <button
                  key={offer.id}
                  type="button"
                  data-testid="deco-buy"
                  disabled={!affordable || busy || isPlaced}
                  onClick={() => void buy(offer.id)}
                  className={`flex items-center gap-2 rounded-2xl border-[3px] p-2 text-left transition-transform active:scale-95 ${
                    isPlaced
                      ? 'border-[#1d4a1f] bg-[#8ee06a]/25'
                      : affordable
                        ? 'border-black/20 bg-white/60'
                        : 'border-black/15 bg-black/10 opacity-60'
                  }`}
                >
                  <div
                    className="shrink-0 rounded-xl p-0.5"
                    style={{ background: `${offer.color}33` }}
                  >
                    <DecoArt art={offer.art} size={44} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[13px] font-black">{offer.name}</div>
                    <div className="flex items-center gap-1 text-[11px] font-bold">
                      <CoinIcon size={13} /> {formatCoins(offer.cost)}
                    </div>
                    {isPlaced && <div className="text-[10px] font-black text-[#2c7a35]">steht hier</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </m.div>
      </m.div>
    </AnimatePresence>
  );
}
