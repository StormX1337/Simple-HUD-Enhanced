import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { playSound } from '../lib/sound';
import { Raccoon } from './art/Raccoon';

const DONE_KEY = 'bandit-bay.tutorial-done';

type Step = 'spin' | 'upgrade' | 'explore' | null;

/** Kurze Einführung: drehen, ausbauen, weiterspielen. */
export function Tutorial(): JSX.Element | null {
  const { state } = useGame();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DONE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [step, setStep] = useState<Step>(null);

  useEffect(() => {
    if (!state || dismissed) {
      setStep(null);
      return;
    }
    if (state.stats.spins === 0) setStep('spin');
    else if (state.buildings.every((building) => building.level === 0)) setStep('upgrade');
    else setStep('explore');
  }, [state, dismissed]);

  if (!state || !step) return null;

  const texts: Record<Exclude<Step, null>, { title: string; text: string }> = {
    spin: {
      title: 'Willkommen in Bandit Bay!',
      text: 'Tippe unten auf DREHEN. Drei gleiche Symbole zahlen groß aus.',
    },
    upgrade: {
      title: 'Bau deine Insel aus',
      text: 'Tippe ein Gebäude auf der Insel an und drücke „Ausbauen". Fünf fertige Gebäude = neue Insel.',
    },
    explore: {
      title: 'Der Rest der Bucht',
      text: 'Hammer bedeutet Angriff, Pfote einen Raubzug. Schilde schützen dein Dorf, Karten geben dicke Set-Boni.',
    },
  };

  const finish = () => {
    playSound('click', 0.4);
    try {
      localStorage.setItem(DONE_KEY, '1');
    } catch {
      /* Speicher ist optional. */
    }
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        key={step}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="pointer-events-none absolute inset-x-2 bottom-2 z-30"
        data-testid="tutorial"
      >
        <div className="panel pointer-events-auto flex items-center gap-2 p-2.5">
          <Raccoon size={52} className="shrink-0 animate-bob" />
          <div className="min-w-0 flex-1">
            <div className="font-display text-sm font-black leading-tight">{texts[step].title}</div>
            <div className="text-[11px] leading-snug opacity-80">{texts[step].text}</div>
          </div>
          <button
            type="button"
            data-testid="tutorial-close"
            onClick={finish}
            className="btn shrink-0 border-black/20 bg-black/10 px-2.5 py-1 text-[11px] text-[#3b2a14]"
          >
            {step === 'explore' ? 'Alles klar' : 'Später'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
