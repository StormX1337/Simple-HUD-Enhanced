import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { api } from '../lib/api';
import { playSound } from '../lib/sound';
import { BuildingArt } from './art/BuildingArt';
import type { VillageOverview } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Übersicht über alle Inseln mit Fortschritt und Gebäudestand. */
export function VillageOverviewOverlay({ open, onClose }: Props): JSX.Element | null {
  const [villages, setVillages] = useState<VillageOverview[]>([]);

  useEffect(() => {
    if (!open) return;
    void api
      .villages()
      .then((data) => setVillages(data.villages))
      .catch(() => undefined);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0d1a2f]/95">
      <div className="flex items-center justify-between px-3 pb-2 pt-[max(0.6rem,env(safe-area-inset-top))]">
        <div className="font-display text-xl font-black text-[#ffd95e] text-outline">
          🏝️ Deine Inseln
        </div>
        <button
          type="button"
          data-testid="villages-close"
          className="btn-ghost px-3 py-1 text-sm"
          onClick={() => {
            playSound('click', 0.4);
            onClose();
          }}
        >
          Schließen
        </button>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto px-3 pb-6">
        {villages.map((village) => {
          const percent = Math.round(village.progress * 100);
          const done = percent >= 100;
          return (
            <m.div
              key={village.id}
              layout
              className={`rounded-3xl border-[3px] p-2.5 ${
                village.current
                  ? 'border-[#f8c73c] bg-gradient-to-b from-[#25406a] to-[#122440] shadow-glow'
                  : village.unlocked
                    ? 'border-black/40 bg-white/10'
                    : 'border-black/40 bg-black/30 opacity-70'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 border-black/40 font-display text-lg font-black text-white"
                  style={{ background: village.palette.ground }}
                >
                  {village.id}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-base font-black text-white">
                    {village.name}
                  </div>
                  <div className="truncate text-[11px] text-white/65">{village.subtitle}</div>
                </div>
                <span
                  className={`shrink-0 rounded-full border-2 px-2 py-0.5 font-display text-[11px] font-black ${
                    done
                      ? 'border-[#1d4a1f] bg-gradient-to-b from-[#8ee06a] to-[#3f9a3a] text-white'
                      : village.current
                        ? 'border-[#7a4a05] bg-gradient-to-b from-[#ffe9a0] to-[#e0a21a] text-[#4a2f05]'
                        : 'border-black/40 bg-black/40 text-white/70'
                  }`}
                >
                  {done ? 'fertig ✓' : village.current ? 'aktuell' : village.unlocked ? 'besucht' : 'gesperrt'}
                </span>
              </div>

              <div className="relative mt-1.5 h-3 overflow-hidden rounded-full border-2 border-black/50 bg-black/40">
                <div
                  className="h-full bg-gradient-to-r from-[#8ee06a] via-[#f8c73c] to-[#ff9a3c] transition-[width] duration-500"
                  style={{ width: `${percent}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white text-outline">
                  {percent}%
                </span>
              </div>

              <div className="mt-1.5 flex items-end justify-between gap-1">
                {village.buildings.map((building) => (
                  <div key={building.name} className="flex min-w-0 flex-1 flex-col items-center">
                    <div className={village.unlocked ? '' : 'opacity-40 grayscale'}>
                      <BuildingArt
                        kind={building.kind}
                        level={building.level}
                        accent={village.palette.accent}
                        size={52}
                      />
                    </div>
                    <span className="-mt-1 rounded-full bg-black/45 px-1.5 text-[9px] font-black text-white">
                      {building.level}/{building.maxLevel}
                    </span>
                  </div>
                ))}
              </div>
            </m.div>
          );
        })}
      </div>
    </div>
  );
}
