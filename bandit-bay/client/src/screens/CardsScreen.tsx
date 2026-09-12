import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { ApiError, api } from '../lib/api';
import { formatCoins } from '../lib/format';
import { playSound } from '../lib/sound';
import { CardArt } from '../components/art/CardArt';
import { SymbolIcon } from '../components/art/SymbolIcon';
import { CardIcon, CoinIcon, ShieldIcon, SpinIcon } from '../components/art/HudIcons';
import type { CardDrop, ChestOffer, SetProgress } from '../types';

export function CardsScreen(): JSX.Element {
  const { state, config, applyState, pushToast, refresh } = useGame();
  const [chests, setChests] = useState<ChestOffer[]>([]);
  const [sets, setSets] = useState<SetProgress[]>([]);
  const [drops, setDrops] = useState<CardDrop[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.collection();
      setChests(data.chests);
      setSets(data.sets);
      applyState(data.state);
    } catch {
      pushToast('Sammlung konnte nicht geladen werden', 'bad');
    }
  }, [applyState, pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!state || !config) return <div className="screen-scroll">Lädt …</div>;

  const openChest = async (chestId: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await api.openChest(chestId);
      applyState(data.state);
      setDrops(data.drops);
      playSound('card', 0.7);
      await load();
    } catch (error) {
      playSound('fail', 0.4);
      pushToast(error instanceof ApiError ? error.message : 'Truhe fehlgeschlagen', 'bad');
    } finally {
      setBusy(false);
    }
  };

  const claimSet = async (setId: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await api.claimSet(setId);
      applyState(data.state);
      playSound('reward', 0.8);
      pushToast(`Set-Belohnung: +${formatCoins(data.coins)} Taler, +${data.spins} Drehungen`, 'good');
      await load();
      await refresh();
    } catch (error) {
      playSound('fail', 0.4);
      pushToast(error instanceof ApiError ? error.message : 'Set konnte nicht eingelöst werden', 'bad');
    } finally {
      setBusy(false);
    }
  };

  const ownedTotal = Object.values(state.cards).filter((count) => count > 0).length;

  return (
    <div className="screen-scroll">
      <div className="panel-dark mb-3 p-3">
        <div className="font-display text-lg font-black">Sammlung & Inventar</div>
        <div className="text-xs text-white/70">
          {ownedTotal} von {config.cards.length} Karten · {sets.filter((entry) => entry.claimed).length} von{' '}
          {sets.length} Sets eingelöst
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1.5 text-center text-[11px] font-black">
          <div className="flex flex-col items-center gap-0.5 rounded-xl border-2 border-black/40 bg-black/30 py-1.5">
            <CoinIcon size={20} />
            {formatCoins(state.coins)}
          </div>
          <div className="flex flex-col items-center gap-0.5 rounded-xl border-2 border-black/40 bg-black/30 py-1.5">
            <SpinIcon size={20} />
            {state.spins}/{state.spinCapacity}
          </div>
          <div className="flex flex-col items-center gap-0.5 rounded-xl border-2 border-black/40 bg-black/30 py-1.5">
            <ShieldIcon size={20} />
            {state.shields}/{state.maxShields}
          </div>
          <div className="flex flex-col items-center gap-0.5 rounded-xl border-2 border-black/40 bg-black/30 py-1.5">
            <CardIcon size={20} />
            {Object.values(state.cards).reduce((sum, count) => sum + count, 0)}
          </div>
        </div>
      </div>

      {/* Truhen */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        {chests.map((chest) => {
          const affordable = state.coins >= chest.cost;
          return (
            <button
              key={chest.id}
              type="button"
              disabled={!affordable || busy}
              onClick={() => void openChest(chest.id)}
              className="panel flex flex-col items-center p-2 text-center transition-transform active:scale-95 disabled:opacity-60"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: `${chest.color}33`, boxShadow: `inset 0 0 0 2px ${chest.color}` }}
              >
                <SymbolIcon id="truhe" size={38} />
              </span>
              <span className="mt-1 font-display text-xs font-bold leading-tight">{chest.name}</span>
              <span className="text-[10px] opacity-70">{chest.cards} Karten</span>
              <span className="mt-1 rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-black">
                🪙 {formatCoins(chest.cost)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sets */}
      <div className="space-y-3">
        {sets.map((set) => {
          const cards = config.cards.filter((card) => card.setId === set.id);
          return (
            <div key={set.id} className="panel p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-display text-base font-bold leading-tight">{set.name}</div>
                  <div className="text-[11px] opacity-70">
                    {set.owned}/{set.total} Karten · Insel {set.villageId}
                  </div>
                </div>
                {set.claimed ? (
                  <span className="rounded-xl bg-black/10 px-2 py-1 text-[11px] font-bold">eingelöst ✓</span>
                ) : (
                  <button
                    type="button"
                    disabled={!set.complete || busy}
                    onClick={() => void claimSet(set.id)}
                    className={`btn px-3 py-1.5 text-xs ${
                      set.complete
                        ? 'bg-gradient-to-b from-[#7fd88a] to-[#3f9a55] text-[#0f2d17]'
                        : 'border-black/15 bg-black/10 text-[#3b2a14]'
                    }`}
                  >
                    Belohnung
                  </button>
                )}
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {cards.map((card) => {
                  const count = state.cards[card.id] ?? 0;
                  const owned = count > 0;
                  return (
                    <motion.div
                      key={card.id}
                      whileTap={{ scale: 0.94 }}
                      className={`relative rounded-xl border-[3px] p-1 text-center shadow-chunkysm ${
                        owned
                          ? 'bg-gradient-to-b from-white to-[#f3e6cd]'
                          : 'border-black/20 bg-black/10'
                      }`}
                      style={owned ? { borderColor: card.color } : undefined}
                    >
                      <div className={owned ? '' : 'opacity-25 grayscale'}>
                        <CardArt art={card.art} color={card.color} size={48} className="mx-auto" />
                      </div>
                      <div className="truncate text-[9px] font-bold leading-tight">
                        {owned ? card.name : '???'}
                      </div>
                      <div className="text-[9px] text-bay-golddark">{'★'.repeat(card.rarity)}</div>
                      {count > 1 && (
                        <span className="absolute -right-1 -top-1 rounded-full border border-black/30 bg-bay-coral px-1 text-[9px] font-black text-white">
                          ×{count}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              {!set.claimed && (
                <div className="mt-2 flex items-center justify-center gap-2 text-[11px] font-bold opacity-80">
                  <span className="flex items-center gap-1">
                    <CoinIcon size={14} /> {formatCoins(set.reward.coins)}
                  </span>
                  <span className="flex items-center gap-1">
                    <SpinIcon size={14} /> {set.reward.spins}
                  </span>
                  {!!set.reward.shields && (
                    <span className="flex items-center gap-1">
                      <ShieldIcon size={14} /> {set.reward.shields}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Truhen-Ergebnis */}
      {drops && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="panel w-full max-w-sm p-4 text-center"
          >
            <div className="font-display text-lg font-black">Truhe geöffnet!</div>
            <div className="my-3 grid grid-cols-3 gap-2">
              {drops.map((drop, index) => (
                <motion.div
                  key={`${drop.card.id}-${index}`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.12 }}
                  className="rounded-xl border-2 p-1"
                  style={{ borderColor: drop.card.color }}
                >
                  <CardArt art={drop.card.art} color={drop.card.color} size={56} className="mx-auto" />
                  <div className="truncate text-[10px] font-bold">{drop.card.name}</div>
                  <div className="text-[10px] font-black text-bay-golddark">
                    {drop.isNew ? 'NEU' : `+${formatCoins(drop.coins)}`}
                  </div>
                </motion.div>
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
              Weiter
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
