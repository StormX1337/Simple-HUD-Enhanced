import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { ApiError } from '../lib/api';
import { playSound } from '../lib/sound';
import { Raccoon } from '../components/art/Raccoon';
import { SymbolIcon } from '../components/art/SymbolIcon';
import { Boat, Cloud, FarIsland, Palm, Sun } from '../components/art/Scenery';

const AVATARS = ['🦝', '🦊', '🐻', '🐼', '🦉', '🐧', '🦦', '🐿️', '🦜', '🐙'];

export function LoginScreen(): JSX.Element {
  const { register } = useGame();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🦝');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await register(name.trim(), avatar);
      playSound('reward', 0.7);
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : 'Start fehlgeschlagen');
      playSound('fail', 0.4);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5 py-8">
      {/* Kulisse */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#8fd6ff] via-[#d8f0ff] to-[#2f6f9e]" />
      <Sun size={110} className="absolute -left-6 -top-6 animate-bob" />
      <Cloud size={120} className="absolute left-[35%] top-6 animate-wave opacity-95" />
      <Cloud size={90} className="absolute right-0 top-28 animate-bob opacity-90" />
      <FarIsland size={120} className="absolute left-2 top-[38%] opacity-70" />
      <Boat size={54} className="absolute right-6 top-[42%] animate-bob" />
      <div className="absolute inset-x-[-10%] bottom-[-28%] h-[46%] rounded-[50%] bg-[#f0dca6]" />
      <div className="absolute inset-x-[-4%] bottom-[-30%] h-[42%] rounded-[50%] bg-[#7cc47f]" />
      <Palm size={70} className="absolute bottom-[2%] left-[6%]" />
      <Palm size={54} className="absolute bottom-[1%] right-[8%]" />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="mb-4 text-center">
          <Raccoon size={120} className="mx-auto animate-bob" cheer />
          <h1 className="logo-title font-display text-5xl font-black">Bandit Bay</h1>
          <p className="mt-1 text-sm font-bold text-[#14304f]">
            Bau deine Insel, dreh am Automaten und schnapp dir die Taler deiner Nachbarn.
          </p>
        </div>

        <form onSubmit={submit} className="panel p-4">
          <label className="font-display text-sm font-bold" htmlFor="name">
            Wie heißt du?
          </label>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={18}
            placeholder="Banditenname"
            className="mt-1 w-full rounded-2xl border-2 border-black/20 bg-white/70 px-3 py-2 font-display text-base outline-none focus:border-bay-gold"
          />

          <div className="mt-3 font-display text-sm font-bold">Wähle dein Wappentier</div>
          <div className="mt-1 grid grid-cols-5 gap-1.5">
            {AVATARS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  playSound('click', 0.3);
                  setAvatar(option);
                }}
                className={`rounded-2xl border-2 py-2 text-2xl transition-transform active:scale-95 ${
                  avatar === option ? 'border-bay-gold bg-bay-gold/30' : 'border-black/15 bg-black/5'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {error && <div className="mt-3 text-center text-sm font-bold text-[#c8301f]">{error}</div>}

          <button
            type="submit"
            disabled={name.trim().length < 2 || busy}
            className="btn-gold mt-4 w-full py-3 text-lg"
          >
            Los geht's!
          </button>
          <p className="mt-2 text-center text-[11px] opacity-70">
            Dein Fortschritt wird auf dem Server gespeichert. Alle Ressourcen sind virtuell – kein
            Echtgeld.
          </p>
        </form>

        <div className="mt-4 flex items-center justify-center gap-2 opacity-90">
          {(['taler', 'beutel', 'hammer', 'pfote', 'schild', 'truhe'] as const).map((id) => (
            <SymbolIcon key={id} id={id} size={34} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
