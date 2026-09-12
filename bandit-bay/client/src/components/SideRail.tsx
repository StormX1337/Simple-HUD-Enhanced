import { playSound } from '../lib/sound';

export interface RailItem {
  id: string;
  icon: string;
  label: string;
  badge?: number;
  highlight?: boolean;
  onClick: () => void;
}

interface Props {
  items: RailItem[];
  side: 'left' | 'right';
}

/** Runde Schnellzugriff-Knöpfe an den Bildschirmrändern. */
export function SideRail({ items, side }: Props): JSX.Element {
  return (
    <div
      className={`pointer-events-none absolute top-16 z-20 flex flex-col gap-3.5 ${
        side === 'left' ? 'left-1' : 'right-1'
      }`}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          data-testid={`rail-${item.id}`}
          onClick={() => {
            playSound('click', 0.35);
            item.onClick();
          }}
          className={`pointer-events-auto relative flex h-10 w-10 items-center justify-center rounded-2xl border-[3px] text-lg shadow-chunkysm transition-transform active:translate-y-[2px] ${
            item.highlight
              ? 'animate-pop border-[#7a1a0c] bg-gradient-to-b from-[#ff8a6b] to-[#c8301f]'
              : 'border-[#0b1830] bg-gradient-to-b from-[#3a5f96]/90 to-[#1b3358]/90'
          }`}
          aria-label={item.label}
        >
          <span className="drop-shadow-[0_2px_0_rgba(0,0,0,0.4)]">{item.icon}</span>
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-black/40 bg-[#0b1830] px-1 text-[8px] font-black uppercase tracking-wide text-[#ffd95e]">
            {item.label}
          </span>
          {!!item.badge && item.badge > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-[#7a1a0c] bg-gradient-to-b from-[#ff8a6b] to-[#d2392a] px-1 text-[10px] font-black text-white">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
