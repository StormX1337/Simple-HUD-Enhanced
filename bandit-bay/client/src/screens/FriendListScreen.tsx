import { useCallback, useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { api, errorText } from '../lib/api';
import { formatCoins } from '../lib/format';
import { playSound } from '../lib/sound';
import { CoinIcon, ShieldIcon } from '../components/art/HudIcons';
import type { FriendInfo } from '../types';

interface Props {
  onAttack: (targetId: string) => void;
  onRaid: (targetId: string) => void;
}

export function FriendListScreen({ onAttack, onRaid }: Props): JSX.Element {
  const { state, pushToast } = useGame();
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.friends();
      setFriends(data.friends);
    } catch {
      pushToast('Freunde konnten nicht geladen werden', 'bad');
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || name.trim().length < 2) return;
    setBusy(true);
    try {
      const data = await api.addFriend(name.trim());
      setFriends(data.friends);
      setName('');
      playSound('reward', 0.6);
      pushToast(`${data.friend.name} ist jetzt dein Freund`, 'good');
    } catch (error) {
      playSound('fail', 0.4);
      pushToast(errorText(error, 'Hinzufügen fehlgeschlagen'), 'bad');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (friendId: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await api.removeFriend(friendId);
      setFriends(data.friends);
      playSound('click', 0.4);
    } catch {
      pushToast('Konnte nicht entfernt werden', 'bad');
    } finally {
      setBusy(false);
    }
  };

  const canAttack = (state?.pendingAttacks ?? 0) > 0;
  const canRaid = (state?.pendingRaids ?? 0) > 0;

  return (
    <div className="space-y-3">
      <div className="panel-dark p-3">
        <div className="font-display text-lg font-black">Freunde</div>
        <div className="text-xs text-white/70">
          Freunde tauchen häufiger als Ziel auf. Dein Name zum Weitergeben:{' '}
          <span className="font-black text-[#ffd95e]">{state?.name}</span>
        </div>
        <form onSubmit={add} className="mt-2 flex gap-1.5">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name des Freundes"
            maxLength={18}
            data-testid="friend-name"
            className="min-w-0 flex-1 rounded-2xl border-2 border-black/30 bg-white/85 px-3 py-1.5 font-display text-sm text-[#3b2a14] outline-none focus:border-[#f8c73c]"
          />
          <button type="submit" data-testid="friend-add" disabled={busy} className="btn-green px-3 py-1.5 text-sm">
            Hinzufügen
          </button>
        </form>
      </div>

      {friends.length === 0 && (
        <div className="panel p-4 text-center text-sm">
          Noch keine Freunde. Trag oben den Namen eines Mitspielers ein – auch die Bots wie
          „Miko Maske" oder „Perla" machen mit.
        </div>
      )}

      {friends.map((friend) => {
        const intact = friend.buildings.filter((building) => building.level > 0).length;
        return (
          <m.div key={friend.id} layout className="panel p-2.5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-black/20 bg-[#2b4874] text-2xl">
                {friend.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-display text-base font-bold">{friend.name}</span>
                  <span className="rounded-full bg-black/15 px-1.5 text-[11px] font-bold">
                    Lvl {friend.level}
                  </span>
                </div>
                <div className="truncate text-[11px] opacity-70">
                  {friend.villageName} · {intact}/{friend.buildings.length} Gebäude
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-[#7a5a1c]">
                    <CoinIcon size={14} /> {formatCoins(friend.estimatedLoot)}
                  </span>
                  <span className="flex items-center gap-0.5">
                    {friend.shields > 0 ? (
                      Array.from({ length: friend.shields }).map((_, index) => (
                        <ShieldIcon key={index} size={14} />
                      ))
                    ) : (
                      <span className="opacity-50">ungeschützt</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-2 flex gap-1.5">
              <button
                type="button"
                disabled={!canAttack}
                onClick={() => onAttack(friend.id)}
                className="btn-red flex-1 py-1.5 text-xs disabled:opacity-40"
              >
                ⚒️ Angriff
              </button>
              <button
                type="button"
                disabled={!canRaid}
                onClick={() => onRaid(friend.id)}
                className="btn flex-1 bg-gradient-to-b from-[#c792ea] to-[#7d51c9] py-1.5 text-xs text-white disabled:opacity-40"
              >
                🐾 Raubzug
              </button>
              <button
                type="button"
                onClick={() => void remove(friend.id)}
                className="btn border-black/20 bg-black/10 px-2.5 py-1.5 text-xs text-[#3b2a14]"
                aria-label="Freund entfernen"
              >
                ✕
              </button>
            </div>
          </m.div>
        );
      })}
    </div>
  );
}
