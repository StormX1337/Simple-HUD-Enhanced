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
const MUSIC_KEY = 'bandit-bay.music';
const MUSIC_FILE = '/audio/music.wav';
const cache = new Map<SoundName, HTMLAudioElement>();

let muted = localStorage.getItem(MUTE_KEY) === '1';
// Musik ist standardmäßig aus, damit niemand überrascht wird.
let musicOn = localStorage.getItem(MUSIC_KEY) === '1';
let musicElement: HTMLAudioElement | null = null;

export function isMuted(): boolean {
  return muted;
}

export function toggleMute(): boolean {
  muted = !muted;
  localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  if (muted) stopMusic();
  else if (musicOn) startMusic();
  return muted;
}

export function isMusicOn(): boolean {
  return musicOn;
}

/** Hintergrundmusik in Dauerschleife, leise im Hintergrund. */
export function startMusic(): void {
  if (muted || !musicOn) return;
  try {
    if (!musicElement) {
      musicElement = new Audio(MUSIC_FILE);
      musicElement.loop = true;
      musicElement.volume = 0.22;
    }
    void musicElement.play().catch(() => undefined);
  } catch {
    /* Musik ist optional. */
  }
}

export function stopMusic(): void {
  musicElement?.pause();
}

export function toggleMusic(): boolean {
  musicOn = !musicOn;
  localStorage.setItem(MUSIC_KEY, musicOn ? '1' : '0');
  if (musicOn) startMusic();
  else stopMusic();
  return musicOn;
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
