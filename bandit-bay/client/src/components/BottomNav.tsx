import { playSound } from '../lib/sound';

export type Screen = 'village' | 'cards' | 'friends' | 'quests' | 'rewards';

const ITEMS: { id: Screen; label: string; icon: string }[] = [
  { id: 'cards', label: 'Karten', icon: '🃏' },
  { id: 'friends', label: 'Freunde', icon: '👥' },
  { id: 'village', label: 'Insel', icon: '🏝️' },
  { id: 'quests', label: 'Quests', icon: '📜' },
  { id: 'rewards', label: 'Bonus', icon: '🎁' },
];

interface Props {
  screen: Screen;
  onChange: (screen: Screen) => void;
  badges?: Partial<Record<Screen, number>>;
}

export function BottomNav({ screen, onChange, badges = {} }: Props): JSX.Element {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-[480px] items-end justify-around border-t-2 border-black/40 bg-gradient-to-b from-[#1b3358] to-[#12233f] px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5">
      {ITEMS.map((item) => {
        const active = screen === item.id;
        const badge = badges[item.id] ?? 0;
        return (
          <button
            key={item.id}
            type="button"
            data-testid={`nav-${item.id}`}
            onClick={() => {
              playSound('click', 0.35);
              onChange(item.id);
            }}
            className={`relative flex flex-1 flex-col items-center rounded-2xl px-1 py-1 transition-transform ${
              active ? '-translate-y-1' : 'opacity-75'
            }`}
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border-2 text-xl ${
                active
                  ? 'border-bay-gold bg-gradient-to-b from-[#ffd95e] to-[#e0a21a] shadow-chunkysm'
                  : 'border-white/15 bg-white/10'
              }`}
            >
              {item.icon}
            </span>
            <span className="mt-0.5 font-display text-[11px] font-bold">{item.label}</span>
            {badge > 0 && (
              <span className="absolute right-1 top-0 flex h-5 min-w-5 items-center justify-center rounded-full border border-black/40 bg-bay-coral px-1 text-[11px] font-black text-white">
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
