import { useCallback, useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { api, errorText } from '../lib/api';
import { formatCoins, formatDuration } from '../lib/format';
import { playSound } from '../lib/sound';
import { CoinIcon, SpinIcon } from '../components/art/HudIcons';
import { SymbolIcon } from '../components/art/SymbolIcon';
import type { TournamentState } from '../types';

export function TournamentScreen(): JSX.Element {
  const { applyState, pushToast } = useGame();
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await api.tournament();
      setTournament(data.tournament);
    } catch {
      pushToast('Turnier konnte nicht geladen werden', 'bad');
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const claim = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await api.claimTournament();
      setTournament(data.tournament);
      applyState(data.state);
      playSound('reward', 0.85);
      pushToast(
        `Turnierpreis Rang ${data.rank}: +${formatCoins(data.coins)} Taler` +
          (data.wildcards > 0 ? ` und ${data.wildcards}× Banditenmaske` : ''),
        'good',
      );
    } catch (error) {
      playSound('fail', 0.4);
      pushToast(errorText(error, 'Preis nicht verfügbar'), 'bad');
    } finally {
      setBusy(false);
    }
  };

  if (!tournament) return <div className="p-4 text-center">Lädt …</div>;
  const seconds = Math.max(0, tournament.endsInSeconds - tick);

  return (
    <div className="space-y-3">
      <div className="panel-dark p-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg font-black leading-tight">{tournament.name}</div>
            <div className="text-[11px] text-white/70">
              Punkte für Angriffe und Raubzüge · endet in {formatDuration(seconds)}
            </div>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl border-2 border-black/40 bg-black/30 py-1.5">
            <div className="font-display text-xl font-black text-[#ffd95e]">
              {tournament.myPoints}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-white/60">Punkte</div>
          </div>
          <div className="rounded-2xl border-2 border-black/40 bg-black/30 py-1.5">
            <div className="font-display text-xl font-black text-[#ffd95e]">
              {tournament.myPoints > 0 ? `#${tournament.myRank}` : '–'}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-white/60">Platz</div>
          </div>
        </div>
      </div>

      {tournament.reward?.available && (
        <m.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 1.8 }} className="panel p-3 text-center">
          <div className="font-display text-base font-black">
            Preis aus dem letzten Turnier: {tournament.reward.label}
          </div>
          <div className="mt-1 flex items-center justify-center gap-3 font-display text-lg font-black">
            <span className="flex items-center gap-1">
              <CoinIcon size={20} /> {formatCoins(tournament.reward.coins)}
            </span>
            <span className="flex items-center gap-1">
              <SpinIcon size={20} /> {tournament.reward.spins}
            </span>
            {tournament.reward.wildcards > 0 && (
              <span className="flex items-center gap-1">
                <SymbolIcon id="joker" size={20} /> {tournament.reward.wildcards}
              </span>
            )}
          </div>
          <button
            type="button"
            data-testid="tournament-claim"
            className="btn-gold mt-2 w-full"
            disabled={busy}
            onClick={() => void claim()}
          >
            Preis abholen
          </button>
        </m.div>
      )}

      <div className="space-y-1.5">
        {tournament.entries.map((entry) => (
          <div
            key={entry.id}
            className={`flex items-center gap-2.5 rounded-2xl border-2 px-3 py-1.5 ${
              entry.isMe
                ? 'border-[#7a4a05] bg-gradient-to-b from-[#ffe9a0] to-[#e0a21a] text-[#4a2f05]'
                : 'border-black/30 bg-white/10 text-white'
            }`}
          >
            <span className="w-7 text-center font-display text-base font-black">
              {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
            </span>
            <span className="text-xl">{entry.avatar}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-sm font-bold">{entry.name}</div>
              <div className="text-[10px] opacity-70">Level {entry.level}</div>
            </div>
            <span className="font-display text-sm font-black">{entry.points} P</span>
          </div>
        ))}
      </div>

      <div className="panel p-3">
        <div className="mb-1 font-display text-base font-bold">Preise</div>
        <div className="space-y-1">
          {tournament.prizes.map((prize) => (
            <div key={prize.label} className="flex items-center justify-between rounded-xl bg-black/5 px-2 py-1 text-[12px]">
              <span className="font-bold">{prize.label}</span>
              <span className="flex items-center gap-2 font-black">
                <span className="flex items-center gap-1">
                  <CoinIcon size={14} /> {formatCoins(prize.coins)}
                </span>
                <span className="flex items-center gap-1">
                  <SpinIcon size={14} /> {prize.spins}
                </span>
                {!!prize.wildcards && (
                  <span className="flex items-center gap-1">
                    <SymbolIcon id="joker" size={14} /> {prize.wildcards}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-[11px] opacity-70">
          Ein Turnier läuft drei Tage. Danach kannst du deinen Preis hier abholen.
        </div>
      </div>
    </div>
  );
}
