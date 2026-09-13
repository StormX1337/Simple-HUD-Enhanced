import { useCallback, useEffect, useState } from 'react';
import { useGame } from '../game/GameContext';
import { api } from '../lib/api';
import { formatCoins, formatTime } from '../lib/format';
import { playSound } from '../lib/sound';
import { TargetList } from '../components/TargetList';
import { TournamentScreen } from './TournamentScreen';
import { FriendListScreen } from './FriendListScreen';
import type { HistoryEntry, LeaderboardEntry, TargetInfo } from '../types';

type Tab = 'friends' | 'targets' | 'tournament' | 'ranking' | 'history';

interface Props {
  onAttack: (targetId?: string) => void;
  onRaid: (targetId?: string) => void;
}

export function FriendsScreen({ onAttack, onRaid }: Props): JSX.Element {
  const { state, pushToast } = useGame();
  const [tab, setTab] = useState<Tab>('friends');
  const [targets, setTargets] = useState<TargetInfo[]>([]);
  const [ranking, setRanking] = useState<LeaderboardEntry[]>([]);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  const load = useCallback(async () => {
    try {
      const [targetData, rankingData, historyData] = await Promise.all([
        api.targets(),
        api.leaderboard(),
        api.history(),
      ]);
      setTargets(targetData.targets);
      setRanking(rankingData.entries);
      setEntries(historyData.entries);
    } catch {
      pushToast('Daten konnten nicht geladen werden', 'bad');
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!state) return <div className="screen-scroll">Lädt …</div>;

  const canAttack = state.pendingAttacks > 0;
  const canRaid = state.pendingRaids > 0;

  return (
    <div className="screen-scroll">
      <div className="mb-3 flex gap-1.5">
        {(
          [
            ['friends', 'Freunde'],
            ['targets', 'Ziele'],
            ['tournament', 'Turnier'],
            ['ranking', 'Rang'],
            ['history', 'Verlauf'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              playSound('click', 0.3);
              setTab(id);
            }}
            data-testid={`friends-tab-${id}`}
            className={`flex-1 rounded-2xl border-2 px-1 py-1.5 font-display text-[12px] font-bold ${
              tab === id
                ? 'border-black/25 bg-gradient-to-b from-[#ffd95e] to-[#e0a21a] text-[#4a2f05]'
                : 'border-white/15 bg-white/10 text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'friends' && (
        <FriendListScreen
          onAttack={(targetId) => onAttack(targetId)}
          onRaid={(targetId) => onRaid(targetId)}
        />
      )}

      {tab === 'targets' && (
        <div>
          <div className="panel-dark mb-3 p-3 text-center text-sm">
            {canAttack || canRaid ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-red flex-1 text-sm disabled:opacity-40"
                  disabled={!canAttack}
                  onClick={() => onAttack()}
                >
                  ⚒️ Angriff ({state.pendingAttacks})
                </button>
                <button
                  type="button"
                  className="btn flex-1 bg-gradient-to-b from-[#c792ea] to-[#8d7ae6] text-sm text-white disabled:opacity-40"
                  disabled={!canRaid}
                  onClick={() => onRaid()}
                >
                  🐾 Raubzug ({state.pendingRaids})
                </button>
              </div>
            ) : (
              <span className="text-white/75">
                Dreh am Automaten, um Angriffe (⚒️) und Raubzüge (🐾) zu gewinnen.
              </span>
            )}
          </div>
          <TargetList
            targets={targets}
            mode={canRaid && !canAttack ? 'raid' : 'attack'}
            busy={!canAttack && !canRaid}
            onPick={(target) => {
              if (canAttack) onAttack(target.id);
              else if (canRaid) onRaid(target.id);
            }}
            onReload={() => void load()}
          />
        </div>
      )}

      {tab === 'tournament' && <TournamentScreen />}

      {tab === 'ranking' && (
        <div className="space-y-1.5">
          {ranking.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-2 ${
                entry.isMe
                  ? 'border-bay-gold bg-gradient-to-b from-[#ffd95e] to-[#e0a21a] text-[#4a2f05]'
                  : 'border-black/25 bg-white/10 text-white'
              }`}
            >
              <span className="w-7 text-center font-display text-base font-black">
                {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
              </span>
              <span className="text-2xl">{entry.avatar}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-sm font-bold">{entry.name}</div>
                <div className="text-[11px] opacity-75">
                  Level {entry.level} · Insel {entry.villageId}
                </div>
              </div>
              <span className="font-display text-sm font-black">🪙 {formatCoins(entry.coins)}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-1.5">
          {entries.length === 0 && (
            <div className="panel p-4 text-center text-sm">Noch keine Ereignisse.</div>
          )}
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-2 rounded-2xl border-2 border-black/25 bg-white/10 px-3 py-2 text-sm">
              <span className="text-xl">{iconFor(entry.type)}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold">{labelFor(entry)}</div>
                <div className="text-[11px] opacity-70">{formatTime(entry.createdAt)}</div>
              </div>
              {entry.amount !== 0 && (
                <span
                  className={`font-display text-sm font-black ${
                    entry.amount > 0 ? 'text-[#9fd356]' : 'text-[#ff9a7b]'
                  }`}
                >
                  {entry.amount > 0 ? '+' : ''}
                  {formatCoins(entry.amount)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function iconFor(type: HistoryEntry['type']): string {
  switch (type) {
    case 'attack':
      return '⚒️';
    case 'attacked':
      return '🛠️';
    case 'raid':
      return '🐾';
    case 'raided':
      return '🕳️';
    case 'blocked':
      return '🛡️';
    case 'quest':
      return '📜';
    case 'daily':
      return '🎁';
    case 'village':
      return '🏝️';
    case 'chest':
      return '🧰';
    case 'set':
      return '🃏';
    case 'upgrade':
      return '🔨';
    case 'gift':
    case 'gifted':
      return '🎁';
    case 'wheel':
      return '🎡';
    case 'tournament':
      return '🏆';
    case 'wildcard':
      return '🎭';
    default:
      return '✨';
  }
}

function labelFor(entry: HistoryEntry): string {
  switch (entry.type) {
    case 'attack':
      return `Angriff auf ${entry.otherName} – ${entry.detail}`;
    case 'attacked':
      return `${entry.otherName} hat dich angegriffen – ${entry.detail}`;
    case 'blocked':
      return `Schild hat ${entry.otherName} abgewehrt`;
    case 'raid':
      return `Raubzug bei ${entry.otherName}`;
    case 'raided':
      return `${entry.otherName} hat dich ausgeraubt`;
    case 'quest':
      return `Quest abgeschlossen: ${entry.detail}`;
    case 'daily':
      return `Tagesbelohnung ${entry.detail}`;
    case 'village':
      return entry.detail;
    case 'chest':
      return `Truhe gekauft: ${entry.detail}`;
    case 'set':
      return `Set eingelöst: ${entry.detail}`;
    case 'upgrade':
      return entry.detail;
    case 'gift':
      return `Karte verschenkt: ${entry.detail}`;
    case 'gifted':
      return `${entry.otherName} schenkte dir ${entry.detail}`;
    case 'wheel':
      return `Glücksrad: ${entry.detail}`;
    case 'tournament':
      return entry.detail;
    case 'wildcard':
      return entry.amount > 0 ? 'Banditenmaske gefunden' : `Banditenmaske: ${entry.detail}`;
    default:
      return entry.detail || 'Ereignis';
  }
}
