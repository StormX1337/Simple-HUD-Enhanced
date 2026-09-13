import { useState } from 'react';
import { useGame } from './game/GameContext';
import { TopBar } from './components/TopBar';
import { BottomNav, type Screen } from './components/BottomNav';
import { SideRail } from './components/SideRail';
import { VillageScene } from './components/VillageScene';
import { SlotMachine } from './components/SlotMachine';
import { AttackOverlay } from './components/AttackOverlay';
import { RaidOverlay } from './components/RaidOverlay';
import { CardReveal } from './components/CardReveal';
import { NewsOverlay } from './components/NewsOverlay';
import { VillageOverviewOverlay } from './components/VillageOverviewOverlay';
import { DecoShop } from './components/DecoShop';
import { Toasts } from './components/Toasts';
import { LoginScreen } from './screens/LoginScreen';
import { CardsScreen } from './screens/CardsScreen';
import { FriendsScreen } from './screens/FriendsScreen';
import { QuestsScreen } from './screens/QuestsScreen';
import { RewardsScreen, type RewardsTab } from './screens/RewardsScreen';
import { Raccoon } from './components/art/Raccoon';
import type { CardDef } from './types';

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
        {screen === 'cards' && <CardsScreen />}
        {screen === 'friends' && (
          <FriendsScreen onAttack={openAttack} onRaid={openRaid} />
        )}
        {screen === 'quests' && <QuestsScreen />}
        {screen === 'rewards' && (
          <RewardsScreen tab={rewardsTab} onTab={setRewardsTab} badge={rewardBadge > 0} />
        )}
      </main>

      <BottomNav
        screen={screen}
        onChange={setScreen}
        badges={{ quests: questBadge, rewards: rewardBadge }}
      />

      <AttackOverlay
        open={battle === 'attack'}
        initialTargetId={revengeTarget}
        onClose={closeBattle}
      />
      <RaidOverlay open={battle === 'raid'} initialTargetId={revengeTarget} onClose={closeBattle} />
      <VillageOverviewOverlay open={villagesOpen} onClose={() => setVillagesOpen(false)} />
      <DecoShop open={decoOpen} onClose={() => setDecoOpen(false)} />
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
      <Toasts />
    </div>
  );
}
