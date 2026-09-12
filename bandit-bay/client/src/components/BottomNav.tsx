import { playSound } from '../lib/sound';
import { CardIcon, StarIcon } from './art/HudIcons';

export type Screen = 'village' | 'cards' | 'friends' | 'quests' | 'rewards';

const ITEMS: { id: Screen; label: string; icon: JSX.Element }[] = [
  { id: 'cards', label: 'Karten', icon: <CardIcon size={26} /> },
  { id: 'friends', label: 'Freunde', icon: <span className="text-xl">👥</span> },
  { id: 'village', label: 'Insel', icon: <span className="text-2xl">🏝️</span> },
  { id: 'quests', label: 'Quests', icon: <StarIcon size={24} /> },
  { id: 'rewards', label: 'Bonus', icon: <span className="text-xl">🎁</span> },
];

interface Props {
  screen: Screen;
  onChange: (screen: Screen) => void;
  badges?: Partial<Record<Screen, number>>;
}

export function BottomNav({ screen, onChange, badges = {} }: Props): JSX.Element {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-[480px] items-end justify-around border-t-4 border-[#0b1830] bg-gradient-to-b from-[#1d3459] to-[#0c1a31] px-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5">
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
            className={`relative flex flex-1 flex-col items-center rounded-2xl px-0.5 py-0.5 transition-transform ${
              active ? '-translate-y-1.5' : 'opacity-80'
            }`}
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border-[3px] ${
                active
                  ? 'border-[#7a4a05] bg-gradient-to-b from-[#ffe9a0] to-[#e0a21a] shadow-[0_4px_0_rgba(0,0,0,0.35),0_0_16px_rgba(248,199,60,0.5)]'
                  : 'border-[#0b1830] bg-gradient-to-b from-[#33527f] to-[#1a2f4f]'
              }`}
            >
              {item.icon}
            </span>
            <span
              className={`mt-0.5 font-display text-[11px] font-black ${
                active ? 'text-[#ffd95e]' : 'text-white/75'
              }`}
            >
              {item.label}
            </span>
            {badge > 0 && (
              <span className="absolute right-1.5 top-0 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-[#7a1a0c] bg-gradient-to-b from-[#ff8a6b] to-[#d2392a] px-1 text-[10px] font-black text-white">
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
