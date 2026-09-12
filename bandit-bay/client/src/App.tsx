import { useState } from 'react';
import { useGame } from './game/GameContext';
import { TopBar } from './components/TopBar';
import { BottomNav, type Screen } from './components/BottomNav';
import { VillageScene } from './components/VillageScene';
import { SlotMachine } from './components/SlotMachine';
import { AttackOverlay } from './components/AttackOverlay';
import { RaidOverlay } from './components/RaidOverlay';
import { CardReveal } from './components/CardReveal';
import { Toasts } from './components/Toasts';
import { LoginScreen } from './screens/LoginScreen';
import { CardsScreen } from './screens/CardsScreen';
import { FriendsScreen } from './screens/FriendsScreen';
import { QuestsScreen } from './screens/QuestsScreen';
import { RewardsScreen } from './screens/RewardsScreen';
import { Raccoon } from './components/art/Raccoon';
import type { CardDef } from './types';

export default function App(): JSX.Element {
  const { state, booting, quests, daily } = useGame();
  const [screen, setScreen] = useState<Screen>('village');
  const [attackOpen, setAttackOpen] = useState(false);
  const [raidOpen, setRaidOpen] = useState(false);
  const [revealed, setRevealed] = useState<{ card: CardDef; isNew: boolean } | null>(null);

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
      <TopBar />

      <main className="flex flex-1 flex-col overflow-hidden pb-[74px]">
        {screen === 'village' && (
          <>
            <VillageScene />
            <SlotMachine
              onAttack={() => setAttackOpen(true)}
              onRaid={() => setRaidOpen(true)}
              onCard={(card, isNew) => setRevealed({ card, isNew })}
            />
          </>
        )}
        {screen === 'cards' && <CardsScreen />}
        {screen === 'friends' && (
          <FriendsScreen onAttack={() => setAttackOpen(true)} onRaid={() => setRaidOpen(true)} />
        )}
        {screen === 'quests' && <QuestsScreen />}
        {screen === 'rewards' && <RewardsScreen />}
      </main>

      <BottomNav
        screen={screen}
        onChange={setScreen}
        badges={{ quests: questBadge, rewards: rewardBadge }}
      />

      <AttackOverlay open={attackOpen} onClose={() => setAttackOpen(false)} />
      <RaidOverlay open={raidOpen} onClose={() => setRaidOpen(false)} />
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
