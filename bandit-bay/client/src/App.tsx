import { Suspense, lazy, useState } from 'react';
import { useGame } from './game/GameContext';
import { TopBar } from './components/TopBar';
import { BottomNav, type Screen } from './components/BottomNav';
import { SideRail } from './components/SideRail';
import { VillageScene } from './components/VillageScene';
import { SlotMachine } from './components/SlotMachine';
import { CardReveal } from './components/CardReveal';
import { NewsOverlay } from './components/NewsOverlay';

// Erst laden, wenn sie gebraucht werden – hält den Start klein.
const AttackOverlay = lazy(() =>
  import('./components/AttackOverlay').then((module) => ({ default: module.AttackOverlay })),
);
const RaidOverlay = lazy(() =>
  import('./components/RaidOverlay').then((module) => ({ default: module.RaidOverlay })),
);
const VillageOverviewOverlay = lazy(() =>
  import('./components/VillageOverviewOverlay').then((module) => ({
    default: module.VillageOverviewOverlay,
  })),
);
const DecoShop = lazy(() =>
  import('./components/DecoShop').then((module) => ({ default: module.DecoShop })),
);
import { Toasts } from './components/Toasts';
import { ConnectionBanner } from './components/ConnectionBanner';
import { LoginScreen } from './screens/LoginScreen';
import type { RewardsTab } from './screens/RewardsScreen';

const CardsScreen = lazy(() =>
  import('./screens/CardsScreen').then((module) => ({ default: module.CardsScreen })),
);
const FriendsScreen = lazy(() =>
  import('./screens/FriendsScreen').then((module) => ({ default: module.FriendsScreen })),
);
const QuestsScreen = lazy(() =>
  import('./screens/QuestsScreen').then((module) => ({ default: module.QuestsScreen })),
);
const RewardsScreen = lazy(() =>
  import('./screens/RewardsScreen').then((module) => ({ default: module.RewardsScreen })),
);
import { Raccoon } from './components/art/Raccoon';
import type { CardDef } from './types';

/** Kurze Ladeanzeige, während ein Bildschirm nachgeladen wird. */
function ScreenLoader(): JSX.Element {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="animate-pulse font-display text-sm text-white/70">Lädt …</div>
    </div>
  );
}

export default function App(): JSX.Element {
  const { state, booting, quests, daily, news, dismissNews } = useGame();
  const [screen, setScreen] = useState<Screen>('village');
  // Angriff und Raubzug teilen sich einen Platz – nie beide gleichzeitig.
  const [battle, setBattle] = useState<'attack' | 'raid' | null>(null);
  const [revealed, setRevealed] = useState<{ card: CardDef; isNew: boolean } | null>(null);
  const [rewardsTab, setRewardsTab] = useState<RewardsTab>('daily');
  const [revengeTarget, setRevengeTarget] = useState<string | null>(null);
  const [villagesOpen, setVillagesOpen] = useState(false);
  const [decoOpen, setDecoOpen] = useState(false);
  const openAttack = (targetId?: string) => {
    setRevengeTarget(targetId ?? null);
    setBattle('attack');
  };
  const openRaid = (targetId?: string) => {
    setRevengeTarget(targetId ?? null);
    setBattle('raid');
  };
  const closeBattle = () => {
    setBattle(null);
    setRevengeTarget(null);
  };

  if (booting) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#12233f] text-center">
        <Raccoon size={120} className="animate-bob" />
        <div className="mt-3 font-display text-2xl font-black text-bay-gold">Bandit Bay</div>
        <div className="text-sm text-white/60">Insel wird vorbereitet …</div>
      </div>
    );
  }

  if (!state) {
    return (
      <>
        <LoginScreen />
        <ConnectionBanner />
        <Toasts />
      </>
    );
  }

  const questBadge = quests.filter((quest) => quest.progress >= quest.target && !quest.claimed).length;
  const rewardBadge = daily?.canClaim ? 1 : 0;

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden bg-[#12233f]">
      <TopBar
        onOpenBonus={() => {
          setRewardsTab('daily');
          setScreen('rewards');
        }}
      />

      <main className="relative flex flex-1 flex-col overflow-hidden pb-[74px]">
        {screen === 'village' && (
          <>
            <SideRail
              side="left"
              items={[
                {
                  id: 'bonus',
                  icon: '🎁',
                  label: 'Bonus',
                  badge: rewardBadge,
                  highlight: rewardBadge > 0,
                  onClick: () => {
                    setRewardsTab('daily');
                    setScreen('rewards');
                  },
                },
                {
                  id: 'wheel',
                  icon: '🎡',
                  label: 'Rad',
                  onClick: () => {
                    setRewardsTab('wheel');
                    setScreen('rewards');
                  },
                },
                {
                  id: 'deco',
                  icon: '🌴',
                  label: 'Deko',
                  onClick: () => setDecoOpen(true),
                },
                {
                  id: 'pets',
                  icon: '🦊',
                  label: 'Tier',
                  highlight: !!state.activePet,
                  onClick: () => {
                    setRewardsTab('pets');
                    setScreen('rewards');
                  },
                },

              ]}
            />
            <SideRail
              side="right"
              items={[
                {
                  id: 'attack',
                  icon: '⚒️',
                  label: 'Angriff',
                  badge: state.pendingAttacks,
                  highlight: state.pendingAttacks > 0,
                  onClick: () => (state.pendingAttacks > 0 ? openAttack() : setScreen('friends')),
                },
                {
                  id: 'raid',
                  icon: '🐾',
                  label: 'Raub',
                  badge: state.pendingRaids,
                  highlight: state.pendingRaids > 0,
                  onClick: () => (state.pendingRaids > 0 ? openRaid() : setScreen('friends')),
                },
                { id: 'rank', icon: '🏆', label: 'Rang', onClick: () => setScreen('friends') },
              ]}
            />
            <VillageScene
              onOpenEvents={() => {
                setRewardsTab('events');
                setScreen('rewards');
              }}
              onOpenVillages={() => setVillagesOpen(true)}
            />
            <SlotMachine
              onAttack={() => openAttack()}
              onRaid={() => openRaid()}
              onCard={(card, isNew) => setRevealed({ card, isNew })}
            />
          </>
        )}
        {screen !== 'village' && (
          <Suspense fallback={<ScreenLoader />}>
            {screen === 'cards' && <CardsScreen />}
            {screen === 'friends' && <FriendsScreen onAttack={openAttack} onRaid={openRaid} />}
            {screen === 'quests' && <QuestsScreen />}
            {screen === 'rewards' && (
              <RewardsScreen tab={rewardsTab} onTab={setRewardsTab} badge={rewardBadge > 0} />
            )}
          </Suspense>
        )}
      </main>

      <BottomNav
        screen={screen}
        onChange={setScreen}
        badges={{ quests: questBadge, rewards: rewardBadge }}
      />

      <Suspense fallback={null}>
        {battle === 'attack' && (
          <AttackOverlay open initialTargetId={revengeTarget} onClose={closeBattle} />
        )}
        {battle === 'raid' && (
          <RaidOverlay open initialTargetId={revengeTarget} onClose={closeBattle} />
        )}
        {villagesOpen && <VillageOverviewOverlay open onClose={() => setVillagesOpen(false)} />}
        {decoOpen && <DecoShop open onClose={() => setDecoOpen(false)} />}
      </Suspense>
      {news.length > 0 && (
        <NewsOverlay
          news={news}
          onClose={dismissNews}
          onRevenge={(targetId, mode) => {
            dismissNews();
            setRevengeTarget(targetId);
            setBattle(mode);
          }}
        />
      )}
      {revealed && (
        <CardReveal
          card={revealed.card}
          isNew={revealed.isNew}
          onClose={() => setRevealed(null)}
        />
      )}
      <ConnectionBanner />
      <Toasts />
    </div>
  );
}
