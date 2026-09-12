import { formatCoins } from '../lib/format';
import { playSound } from '../lib/sound';
import { CoinIcon, ShieldIcon } from './art/HudIcons';
import type { TargetInfo } from '../types';

interface Props {
  targets: TargetInfo[];
  mode: 'attack' | 'raid';
  onPick: (target: TargetInfo) => void;
  onReload?: () => void;
  busy?: boolean;
}

export function TargetList({ targets, mode, onPick, onReload, busy = false }: Props): JSX.Element {
  return (
    <div className="space-y-2">
      {targets.map((target) => {
        const intact = target.buildings.filter((building) => building.level > 0).length;
        return (
          <button
            key={target.id}
            type="button"
            data-testid="target-item"
            disabled={busy}
            onClick={() => {
              playSound('click', 0.4);
              onPick(target);
            }}
            className="panel flex w-full items-center gap-3 p-2.5 text-left transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-black/20 bg-[#2b4874] text-2xl">
              {target.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-display text-base font-bold">{target.name}</span>
                <span className="rounded-full bg-black/15 px-1.5 text-[11px] font-bold">
                  Lvl {target.level}
                </span>
                {target.isBot && (
                  <span className="rounded-full bg-black/10 px-1.5 text-[10px] opacity-70">Bot</span>
                )}
              </div>
              <div className="truncate text-[11px] opacity-70">
                {target.villageName} · {intact}/{target.buildings.length} Gebäude
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] font-bold">
                <span className="flex items-center gap-1 text-[#7a5a1c]">
                  <CoinIcon size={14} />
                  {mode === 'raid' ? '≈ ' : ''}
                  {formatCoins(target.estimatedLoot)}
                </span>
                <span className="flex items-center gap-0.5">
                  {target.shields > 0 ? (
                    Array.from({ length: target.shields }).map((_, index) => (
                      <ShieldIcon key={index} size={14} />
                    ))
                  ) : (
                    <span className="opacity-50">ungeschützt</span>
                  )}
                </span>
              </div>
            </div>
            <span className="shrink-0 rounded-xl border-2 border-black/20 bg-gradient-to-b from-[#ffd95e] to-[#e0a21a] px-2 py-1 font-display text-xs font-black text-[#4a2f05]">
              {mode === 'attack' ? 'Angreifen' : 'Rauben'}
            </span>
          </button>
        );
      })}
      {onReload && (
        <button type="button" className="btn-ghost w-full text-sm" onClick={onReload} disabled={busy}>
          🔄 Andere Ziele zeigen
        </button>
      )}
    </div>
  );
}
