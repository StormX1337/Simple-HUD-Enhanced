import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { ApiError, api } from '../lib/api';
import { formatCoins } from '../lib/format';
import { playSound } from '../lib/sound';
import { CoinIcon, SpinIcon, StarIcon } from '../components/art/HudIcons';
import { AchievementsScreen } from './AchievementsScreen';

export function QuestsScreen(): JSX.Element {
  const { quests, setQuests, applyState, pushToast, refresh, state } = useGame();
  const [tab, setTab] = useState<'daily' | 'goals'>('daily');

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const claim = async (questId: string) => {
    try {
      const data = await api.claimQuest(questId);
      applyState(data.state);
      if (data.quests) setQuests(data.quests);
      playSound('reward', 0.8);
      pushToast(`+${formatCoins(data.coins)} Taler, +${data.spins} Drehungen`, 'good');
      if (data.levelUps > 0) playSound('levelup', 0.7);
    } catch (error) {
      playSound('fail', 0.4);
      pushToast(error instanceof ApiError ? error.message : 'Belohnung nicht verfügbar', 'bad');
    }
  };

  return (
    <div className="screen-scroll">
      <div className="mb-3 flex gap-1.5">
        {(
          [
            ['daily', 'Tagesquests'],
            ['goals', 'Meilensteine'],
          ] as ['daily' | 'goals', string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            data-testid={`quests-tab-${id}`}
            onClick={() => {
              playSound('click', 0.3);
              setTab(id);
            }}
            className={`flex-1 rounded-2xl border-2 px-2 py-1.5 font-display text-sm font-bold ${
              tab === id
                ? 'border-[#7a4a05] bg-gradient-to-b from-[#ffe9a0] to-[#e0a21a] text-[#4a2f05]'
                : 'border-white/15 bg-white/10 text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'goals' && <AchievementsScreen />}

      {tab === 'daily' && (
        <>
      <div className="panel-dark mb-3 p-3">
        <div className="font-display text-lg font-black">Tagesquests</div>
        <div className="text-xs text-white/70">
          Setzen sich jeden Tag um Mitternacht (UTC) zurück. Aktuell:{' '}
          {quests.filter((quest) => quest.claimed).length}/{quests.length} erledigt
        </div>
      </div>

      <div className="space-y-2">
        {quests.map((quest) => {
          const percent = Math.min(100, (quest.progress / quest.target) * 100);
          const ready = quest.progress >= quest.target && !quest.claimed;
          return (
            <motion.div key={quest.id} layout className="panel p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-display text-base font-bold leading-tight">{quest.name}</div>
                  <div className="text-[11px] opacity-70">{quest.description}</div>
                </div>
                {quest.claimed ? (
                  <span className="rounded-xl bg-black/10 px-2 py-1 text-[11px] font-bold">fertig ✓</span>
                ) : (
                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => void claim(quest.id)}
                    className={`btn px-3 py-1.5 text-xs ${
                      ready
                        ? 'bg-gradient-to-b from-[#7fd88a] to-[#3f9a55] text-[#0f2d17]'
                        : 'border-black/15 bg-black/10 text-[#3b2a14]'
                    }`}
                  >
                    {ready ? 'Abholen' : `${quest.progress}/${quest.target}`}
                  </button>
                )}
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full border border-black/20 bg-black/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7cc6fe] to-[#3f9a55] transition-[width] duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] font-bold opacity-80">
                <span className="flex items-center gap-1">
                  <CoinIcon size={14} /> {formatCoins(quest.reward.coins)}
                </span>
                <span className="flex items-center gap-1">
                  <SpinIcon size={14} /> {quest.reward.spins}
                </span>
                <span className="flex items-center gap-1">
                  <StarIcon size={13} /> {quest.reward.xp} XP
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

        </>
      )}

      {tab === 'daily' && state && (
        <div className="panel mt-4 p-3 text-sm">
          <div className="mb-1 font-display text-base font-bold">Deine Statistik</div>
          <div className="grid grid-cols-2 gap-2 text-[13px]">
            <div>🎰 Drehungen: {state.stats.spins}</div>
            <div>⚒️ Angriffe: {state.stats.attacks}</div>
            <div>🐾 Raubzüge: {state.stats.raids}</div>
            <div>🕳️ Ausgeraubt: {state.stats.timesRaided}×</div>
          </div>
        </div>
      )}
    </div>
  );
}
