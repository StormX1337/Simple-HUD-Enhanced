import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { ApiError, api } from '../lib/api';
import { formatCoins } from '../lib/format';
import { playSound } from '../lib/sound';

export function QuestsScreen(): JSX.Element {
  const { quests, setQuests, applyState, pushToast, refresh, state } = useGame();

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
              <div className="mt-1 text-[11px] opacity-70">
                Belohnung: 🪙 {formatCoins(quest.reward.coins)} · 🎰 {quest.reward.spins} · ⭐{' '}
                {quest.reward.xp} XP
              </div>
            </motion.div>
          );
        })}
      </div>

      {state && (
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
