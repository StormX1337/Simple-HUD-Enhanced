import { useState } from 'react';
import { useGame } from '../game/GameContext';
import { formatCoins, formatDuration, formatFull } from '../lib/format';
import { isMuted, playSound, toggleMute } from '../lib/sound';

export function TopBar(): JSX.Element | null {
  const { state, secondsToNextSpin, logout, config } = useGame();
  const [muted, setMuted] = useState(isMuted());
  const [menuOpen, setMenuOpen] = useState(false);
  if (!state) return null;

  const xpPercent = Math.min(100, (state.xp / state.xpForNextLevel) * 100);
  const village = config?.villages.find((v) => v.id === state.villageId);

  return (
    <header className="relative z-30 shrink-0 bg-gradient-to-b from-[#12233f] to-[#1b3358] px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] shadow-lg">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-bay-gold/70 bg-[#24406b] text-2xl">
              {state.avatar}
            </div>
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full border border-black/30 bg-bay-gold px-1.5 text-[11px] font-black text-[#3b2a14]">
              {state.level}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-sm font-bold text-outline">{state.name}</div>
            <div className="mt-0.5 h-2.5 w-full overflow-hidden rounded-full border border-black/40 bg-black/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#7cc6fe] to-[#c792ea] transition-[width] duration-500"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <div className="mt-0.5 text-[10px] text-white/70">
              {formatFull(state.xp)} / {formatFull(state.xpForNextLevel)} XP · {village?.name}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <div className="chip bg-gradient-to-b from-[#f6c343] to-[#c98c14] text-[#3b2a14]">
              <span>🪙</span>
              <span title={formatFull(state.coins)}>{formatCoins(state.coins)}</span>
            </div>
            <button
              type="button"
              className="chip bg-black/40 text-white"
              onClick={() => {
                playSound('click', 0.4);
                setMenuOpen((open) => !open);
              }}
              aria-label="Menü"
            >
              ☰
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="chip bg-gradient-to-b from-[#7cc6fe] to-[#2f7fd0] text-[#062441]">
              <span>🎰</span>
              <span>
                {state.spins}
                <span className="ml-1 text-[10px] font-semibold opacity-80">
                  {state.spins >= state.spinCapacity ? 'voll' : formatDuration(secondsToNextSpin)}
                </span>
              </span>
            </div>
            <div className="chip bg-black/40">
              {Array.from({ length: state.maxShields }).map((_, index) => (
                <span key={index} className={index < state.shields ? '' : 'opacity-25 grayscale'}>
                  🛡️
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="absolute right-3 top-full z-40 mt-1 w-56 animate-pop panel-dark p-3 text-sm">
          <div className="mb-2 font-display text-base">Einstellungen</div>
          <button
            type="button"
            className="btn-ghost mb-2 w-full text-sm"
            onClick={() => {
              const next = toggleMute();
              setMuted(next);
              if (!next) playSound('click');
            }}
          >
            {muted ? '🔇 Ton aus' : '🔊 Ton an'}
          </button>
          <div className="mb-2 space-y-1 text-xs text-white/75">
            <div>Angriffe: {state.stats.attacks}</div>
            <div>Raubzüge: {state.stats.raids}</div>
            <div>Drehungen: {state.stats.spins}</div>
            <div>Ausgeraubt: {state.stats.timesRaided}×</div>
          </div>
          <button
            type="button"
            className="btn-red w-full text-sm"
            onClick={() => {
              playSound('click', 0.4);
              setMenuOpen(false);
              logout();
            }}
          >
            Abmelden
          </button>
        </div>
      )}
    </header>
  );
}
