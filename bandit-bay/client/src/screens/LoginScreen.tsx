import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { ApiError } from '../lib/api';
import { playSound } from '../lib/sound';
import { Raccoon } from '../components/art/Raccoon';
import { SymbolIcon } from '../components/art/SymbolIcon';

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
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-[#12233f] via-[#1b3358] to-[#2f6f9e] px-5 py-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm"
      >
        <div className="mb-4 text-center">
          <Raccoon size={120} className="mx-auto animate-bob" cheer />
          <h1 className="font-display text-4xl font-black text-bay-gold text-outline">Bandit Bay</h1>
          <p className="text-sm text-white/80">
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
