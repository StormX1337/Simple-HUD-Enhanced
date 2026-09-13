import { playSound } from '../lib/sound';
import { DailyScreen } from './DailyScreen';
import { WheelScreen } from './WheelScreen';
import { PetsScreen } from './PetsScreen';
import { EventsScreen } from './EventsScreen';

export type RewardsTab = 'daily' | 'wheel' | 'pets' | 'events';

const TABS: [RewardsTab, string][] = [
  ['daily', 'Täglich'],
  ['wheel', 'Rad'],
  ['pets', 'Tiere'],
  ['events', 'Events'],
];

interface Props {
  tab: RewardsTab;
  onTab: (tab: RewardsTab) => void;
  badge?: boolean;
}

export function RewardsScreen({ tab, onTab, badge = false }: Props): JSX.Element {
  return (
    <div className="screen-scroll">
      <div className="mb-3 flex gap-1.5">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            data-testid={`rewards-tab-${id}`}
            onClick={() => {
              playSound('click', 0.3);
              onTab(id);
            }}
            className={`relative flex-1 rounded-2xl border-2 px-1.5 py-1.5 font-display text-[13px] font-bold ${
              tab === id
                ? 'border-[#7a4a05] bg-gradient-to-b from-[#ffe9a0] to-[#e0a21a] text-[#4a2f05]'
                : 'border-white/15 bg-white/10 text-white'
            }`}
          >
            {label}
            {id === 'daily' && badge && tab !== 'daily' && (
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#7a1a0c] bg-[#ff6b5b]" />
            )}
          </button>
        ))}
      </div>

      {tab === 'daily' && <DailyScreen />}
      {tab === 'wheel' && <WheelScreen />}
      {tab === 'pets' && <PetsScreen />}
      {tab === 'events' && <EventsScreen />}
    </div>
  );
}
