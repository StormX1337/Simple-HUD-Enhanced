import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { ApiError, api } from '../lib/api';
import { formatCoins } from '../lib/format';
import { playSound } from '../lib/sound';
import { CoinIcon, SpinIcon, StarIcon } from '../components/art/HudIcons';
import type { AchievementState } from '../types';

export function AchievementsScreen(): JSX.Element {
  const { applyState, pushToast } = useGame();
  const [achievements, setAchievements] = useState<AchievementState[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.achievements();
      setAchievements(data.achievements);
      applyState(data.state);
    } catch {
      pushToast('Meilensteine konnten nicht geladen werden', 'bad');
    }
  }, [applyState, pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const claim = async (id: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await api.claimAchievement(id);
      setAchievements(data.achievements);
      applyState(data.state);
      playSound('reward', 0.8);
      pushToast(`+${formatCoins(data.coins)} Taler, +${data.spins} Drehungen`, 'good');
      if (data.levelUps > 0) playSound('levelup', 0.7);
    } catch (error) {
      playSound('fail', 0.4);
      pushToast(error instanceof ApiError ? error.message : 'Belohnung nicht verfügbar', 'bad');
    } finally {
      setBusy(false);
    }
  };

  const claimedCount = achievements.filter((entry) => entry.claimed).length;

  return (
    <div className="space-y-2">
      <div className="panel-dark p-3">
        <div className="font-display text-lg font-black">Meilensteine</div>
        <div className="text-xs text-white/70">
          {claimedCount} von {achievements.length} Belohnungen abgeholt – dauerhafte Ziele, die nicht
          zurückgesetzt werden.
        </div>
      </div>

      {achievements.map((entry) => {
        const percent = Math.min(100, (entry.progress / entry.target) * 100);
        const ready = entry.done && !entry.claimed;
        return (
          <motion.div key={entry.id} layout className={`panel p-3 ${entry.claimed ? 'opacity-75' : ''}`}>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-display text-base font-black leading-tight">{entry.name}</div>
                <div className="text-[11px] opacity-70">{entry.description}</div>
              </div>
              {entry.claimed ? (
                <span className="rounded-xl bg-black/10 px-2 py-1 text-[11px] font-bold">fertig ✓</span>
              ) : (
                <button
                  type="button"
                  data-testid={ready ? 'achievement-claim' : undefined}
                  disabled={!ready || busy}
                  onClick={() => void claim(entry.id)}
                  className={`btn px-3 py-1.5 text-xs ${
                    ready
                      ? 'bg-gradient-to-b from-[#ffd95e] to-[#e0a21a] text-[#4a2f05]'
                      : 'border-black/15 bg-black/10 text-[#3b2a14]'
                  }`}
                >
                  {ready ? 'Abholen' : `${entry.progress}/${entry.target}`}
                </button>
              )}
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full border border-black/20 bg-black/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8ee06a] to-[#f8c73c] transition-[width] duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px] font-bold opacity-80">
              <span className="flex items-center gap-1">
                <CoinIcon size={14} /> {formatCoins(entry.reward.coins)}
              </span>
              <span className="flex items-center gap-1">
                <SpinIcon size={14} /> {entry.reward.spins}
              </span>
              {entry.reward.xp > 0 && (
                <span className="flex items-center gap-1">
                  <StarIcon size={13} /> {entry.reward.xp} XP
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
