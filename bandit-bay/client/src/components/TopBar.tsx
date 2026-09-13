import { useState } from 'react';
import { useGame } from '../game/GameContext';
import { formatCoins, formatDuration, formatFull } from '../lib/format';
import { isMuted, isMusicOn, playSound, toggleMusic, toggleMute } from '../lib/sound';
import { CoinIcon, ShieldIcon, SpinIcon, StarIcon } from './art/HudIcons';
import { api, errorText } from '../lib/api';
import { Raccoon } from './art/Raccoon';

interface Props {
  onOpenBonus?: () => void;
}

export function TopBar({ onOpenBonus }: Props): JSX.Element | null {
  const { state, secondsToNextSpin, logout, config, applyState, pushToast } = useGame();
  const [muted, setMuted] = useState(isMuted());
  const [music, setMusic] = useState(isMusicOn());
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);
  if (!state) return null;

  const save = async (name: string, avatar: string) => {
    if (saving) return;
    setSaving(true);
    try {
      const data = await api.updateProfile(name.trim(), avatar);
      applyState(data.state);
      playSound('reward', 0.5);
      pushToast('Profil gespeichert', 'good');
    } catch (error) {
      playSound('fail', 0.4);
      pushToast(errorText(error, 'Speichern fehlgeschlagen'), 'bad');
    } finally {
      setSaving(false);
    }
  };

  const xpPercent = Math.min(100, (state.xp / state.xpForNextLevel) * 100);
  const village = config?.villages.find((v) => v.id === state.villageId);

  return (
    <header className="relative z-30 shrink-0 bg-gradient-to-b from-[#0b1830] via-[#14294a] to-[#1b3358] px-2 pb-1.5 pt-[max(0.4rem,env(safe-area-inset-top))] shadow-[0_4px_14px_rgba(0,0,0,0.5)]">
      {/* Währungsleiste */}
      <div className="flex items-center gap-1.5">
        <div className="hud-pill flex-1" data-coin-pill>
          <CoinIcon size={26} className="-ml-1.5 shrink-0 drop-shadow" />
          <span className="flex-1 truncate text-center" title={formatFull(state.coins)}>
            {formatCoins(state.coins)}
          </span>
        </div>

        <button
          type="button"
          className="hud-pill min-w-[92px]"
          onClick={() => {
            playSound('click', 0.35);
            onOpenBonus?.();
          }}
        >
          <SpinIcon size={26} className="-ml-1.5 shrink-0 drop-shadow" />
          <span className="flex-1 text-center">
            {state.spins}
            <span className="ml-1 text-[10px] font-bold text-white/60">
              {state.spins >= state.spinCapacity ? '' : formatDuration(secondsToNextSpin)}
            </span>
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#1d4a1f] bg-gradient-to-b from-[#8ee06a] to-[#3f9a3a] text-[13px] font-black leading-none text-white">
            +
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            playSound('click', 0.4);
            setMenuOpen((open) => !open);
          }}
          aria-label="Menü"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#5b1a12] bg-gradient-to-b from-[#e05a3c] to-[#a92b18] text-lg font-black text-white shadow-chunkysm active:translate-y-[2px]"
        >
          ☰
        </button>
      </div>

      {/* Spielerzeile */}
      <div className="mt-1.5 flex items-center gap-2">
        <div className="relative shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-[#f8c73c] bg-gradient-to-b from-[#3a5f96] to-[#1d3559] text-xl shadow-chunkysm">
            {state.avatar}
          </div>
          <span className="absolute -bottom-1 left-1/2 flex h-5 min-w-[22px] -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#7a4a05] bg-gradient-to-b from-[#ffe9a0] to-[#e0a21a] px-1 text-[11px] font-black leading-none text-[#4a2f05]">
            {state.level}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="truncate font-display text-sm font-black text-outline">{state.name}</span>
            <span className="truncate text-[10px] font-bold text-[#ffd95e]">{village?.name}</span>
          </div>
          <div className="relative mt-0.5 h-3 w-full overflow-hidden rounded-full border-2 border-[#0b1830] bg-[#0f2038]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8ee06a] via-[#f8c73c] to-[#ff9a3c] transition-[width] duration-500"
              style={{ width: `${xpPercent}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white/90 text-outline">
              {formatFull(state.xp)} / {formatFull(state.xpForNextLevel)} XP
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 rounded-full border-2 border-[#0b1830] bg-[#0f2038]/80 px-1.5 py-0.5">
          {Array.from({ length: state.maxShields }).map((_, index) => (
            <ShieldIcon key={index} size={20} active={index < state.shields} />
          ))}
        </div>
      </div>

      {menuOpen && (
        <div className="absolute right-2 top-full z-40 mt-1 w-60 animate-pop panel-dark p-3 text-sm">
          <div className="mb-2 flex items-center gap-2">
            <Raccoon size={42} />
            <div className="font-display text-base leading-tight">
              Bandit Bay
              <div className="text-[11px] font-normal text-white/60">Einstellungen</div>
            </div>
          </div>
          <div className="mb-2 flex gap-1.5">
            <button
              type="button"
              data-testid="toggle-sound"
              className="btn-ghost flex-1 text-sm"
              onClick={() => {
                const next = toggleMute();
                setMuted(next);
                if (!next) playSound('click');
              }}
            >
              {muted ? '🔇 Ton aus' : '🔊 Ton an'}
            </button>
            <button
              type="button"
              data-testid="toggle-music"
              className="btn-ghost flex-1 text-sm"
              onClick={() => {
                const next = toggleMusic();
                setMusic(next);
                playSound('click', 0.3);
              }}
            >
              {music ? '🎵 Musik an' : '🎵 Musik aus'}
            </button>
          </div>
          <div className="mb-2 grid grid-cols-2 gap-1 rounded-2xl bg-black/30 p-2 text-[11px] text-white/80">
            <div className="flex items-center gap-1">
              <StarIcon size={14} /> Level {state.level}
            </div>
            <div>🎰 {state.stats.spins} Drehungen</div>
            <div>⚒️ {state.stats.attacks} Angriffe</div>
            <div>🐾 {state.stats.raids} Raubzüge</div>
          </div>
          <button
            type="button"
            data-testid="open-profile"
            className="btn-ghost mb-2 w-full text-sm"
            onClick={() => {
              playSound('click', 0.35);
              setDraftName(state.name);
              setEditing((value) => !value);
            }}
          >
            ✏️ Profil ändern
          </button>

          {editing && (
            <div className="mb-2 rounded-2xl bg-black/30 p-2">
              <input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                maxLength={18}
                data-testid="profile-name"
                className="w-full rounded-xl border-2 border-black/30 bg-white/85 px-2 py-1 font-display text-sm text-[#3b2a14] outline-none focus:border-[#f8c73c]"
              />
              <div className="mt-1.5 grid grid-cols-5 gap-1">
                {(config?.avatars ?? []).map((option) => (
                  <button
                    key={option}
                    type="button"
                    data-testid="profile-avatar"
                    onClick={() => {
                      playSound('click', 0.3);
                      void save(draftName, option);
                    }}
                    className={`rounded-xl border-2 py-1 text-lg ${
                      state.avatar === option ? 'border-[#f8c73c] bg-[#f8c73c]/25' : 'border-white/15 bg-white/10'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <button
                type="button"
                data-testid="profile-save"
                disabled={saving}
                className="btn-green mt-2 w-full py-1.5 text-sm"
                onClick={() => void save(draftName, state.avatar)}
              >
                Speichern
              </button>
            </div>
          )}

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
