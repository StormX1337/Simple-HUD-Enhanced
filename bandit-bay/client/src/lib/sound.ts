/**
 * Sehr einfacher Sound-Manager. Die WAV-Dateien unter /audio sind
 * Platzhalter und koennen 1:1 durch eigene Assets ersetzt werden.
 */
export type SoundName =
  | 'click'
  | 'spin'
  | 'reel'
  | 'coin'
  | 'spins'
  | 'shield'
  | 'attack'
  | 'raid'
  | 'upgrade'
  | 'reward'
  | 'levelup'
  | 'card'
  | 'jackpot'
  | 'fail';

const FILES: Record<SoundName, string> = {
  click: '/audio/click.wav',
  spin: '/audio/spin.wav',
  reel: '/audio/reel.wav',
  coin: '/audio/coin.wav',
  spins: '/audio/spins.wav',
  shield: '/audio/shield.wav',
  attack: '/audio/attack.wav',
  raid: '/audio/raid.wav',
  upgrade: '/audio/upgrade.wav',
  reward: '/audio/reward.wav',
  levelup: '/audio/levelup.wav',
  card: '/audio/card.wav',
  jackpot: '/audio/jackpot.wav',
  fail: '/audio/fail.wav',
};

const MUTE_KEY = 'bandit-bay.muted';
const cache = new Map<SoundName, HTMLAudioElement>();

let muted = localStorage.getItem(MUTE_KEY) === '1';

export function isMuted(): boolean {
  return muted;
}

export function toggleMute(): boolean {
  muted = !muted;
  localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  return muted;
}

export function playSound(name: SoundName, volume = 0.6): void {
  if (muted) return;
  try {
    let audio = cache.get(name);
    if (!audio) {
      audio = new Audio(FILES[name]);
      audio.preload = 'auto';
      cache.set(name, audio);
    }
    const instance = audio.cloneNode(true) as HTMLAudioElement;
    instance.volume = volume;
    void instance.play().catch(() => undefined);
  } catch {
    /* Audio ist optional – Fehler werden bewusst ignoriert. */
  }
}

export function preloadSounds(): void {
  for (const name of Object.keys(FILES) as SoundName[]) {
    if (cache.has(name)) continue;
    const audio = new Audio(FILES[name]);
    audio.preload = 'auto';
    cache.set(name, audio);
  }
}
