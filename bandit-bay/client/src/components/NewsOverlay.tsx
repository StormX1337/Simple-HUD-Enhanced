import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { formatCoins, formatTime } from '../lib/format';
import { playSound } from '../lib/sound';
import { Raccoon } from './art/Raccoon';
import { CoinIcon, ShieldIcon } from './art/HudIcons';
import type { HistoryEntry } from '../types';

interface Props {
  news: HistoryEntry[];
  onClose: () => void;
  onRevenge: (targetId: string, mode: 'attack' | 'raid') => void;
}

/** Zeigt beim Zurückkommen, was in der Zwischenzeit im Dorf passiert ist. */
export function NewsOverlay({ news, onClose, onRevenge }: Props): JSX.Element {
  const { state } = useGame();
  const stolen = news
    .filter((entry) => entry.type === 'raided')
    .reduce((sum, entry) => sum + entry.amount, 0);
  const blocked = news.filter((entry) => entry.type === 'blocked').length;
  const damaged = news.filter((entry) => entry.type === 'attacked').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ scale: 0.85, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        className="panel max-h-[86vh] w-full max-w-sm overflow-y-auto p-4"
      >
        <div className="flex items-center gap-2">
          <Raccoon size={58} />
          <div>
            <div className="font-display text-lg font-black leading-tight">Während du weg warst</div>
            <div className="text-[11px] opacity-70">
              {damaged} Angriff(e) · {blocked} geblockt · {formatCoins(stolen)} Taler weg
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          {news.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-2 rounded-2xl border-2 border-black/15 bg-black/5 px-2.5 py-1.5"
            >
              <span className="text-xl">
                {entry.type === 'raided'
                  ? '🕳️'
                  : entry.type === 'blocked'
                    ? '🛡️'
                    : entry.type === 'gifted'
                      ? '🎁'
                      : '⚒️'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-[14px] font-black leading-tight">
                  {entry.otherName}
                </div>
                <div className="truncate text-[11px] opacity-75">
                  {entry.type === 'raided' && 'hat dich ausgeraubt'}
                  {entry.type === 'blocked' && 'prallte am Schild ab'}
                  {entry.type === 'attacked' && 'hat ein Gebäude beschädigt'}
                  {entry.type === 'gifted' && `schenkte dir ${entry.detail}`}
                  {' · '}
                  {formatTime(entry.createdAt)}
                </div>
              </div>
              {entry.amount > 0 && (
                <span className="flex shrink-0 items-center gap-0.5 font-display text-sm font-black text-[#c8301f]">
                  −<CoinIcon size={14} />
                  {formatCoins(entry.amount)}
                </span>
              )}
              {entry.otherId && (state?.pendingAttacks ?? 0) + (state?.pendingRaids ?? 0) > 0 && (
                <button
                  type="button"
                  className="btn-red shrink-0 px-2 py-1 text-[11px]"
                  onClick={() => {
                    playSound('click', 0.4);
                    onRevenge(
                      entry.otherId as string,
                      (state?.pendingAttacks ?? 0) > 0 ? 'attack' : 'raid',
                    );
                  }}
                >
                  Rache
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-2xl border-2 border-black/15 bg-black/5 px-2.5 py-2 text-[11px]">
          <ShieldIcon size={18} />
          <span>
            Tipp: Drei gleiche Schilde am Automaten schützen dein Dorf vor dem nächsten Angriff.
          </span>
        </div>

        <button
          type="button"
          data-testid="news-close"
          className="btn-gold mt-3 w-full"
          onClick={() => {
            playSound('click', 0.4);
            onClose();
          }}
        >
          Alles klar!
        </button>
      </motion.div>
    </div>
  );
}
