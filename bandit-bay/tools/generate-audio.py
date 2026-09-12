#!/usr/bin/env python3
"""Erzeugt die Platzhalter-Soundeffekte fuer Bandit Bay.

Die Dateien liegen in client/public/audio und koennen jederzeit durch
echte Aufnahmen mit gleichem Dateinamen ersetzt werden.
"""
import math
import os
import struct
import wave

RATE = 22050
OUT = os.path.join(os.path.dirname(__file__), '..', 'client', 'public', 'audio')


def env(i, n, attack=0.02, release=0.4):
    a = int(n * attack)
    r = int(n * release)
    if i < a:
        return i / max(1, a)
    if i > n - r:
        return max(0.0, (n - i) / max(1, r))
    return 1.0


def tone(freq_start, freq_end, dur, vol=0.5, shape='sine', noise=0.0):
    n = int(RATE * dur)
    samples = []
    phase = 0.0
    for i in range(n):
        t = i / n
        freq = freq_start + (freq_end - freq_start) * t
        phase += 2 * math.pi * freq / RATE
        if shape == 'square':
            value = 1.0 if math.sin(phase) >= 0 else -1.0
        elif shape == 'saw':
            value = 2 * ((phase / (2 * math.pi)) % 1.0) - 1.0
        else:
            value = math.sin(phase)
        if noise:
            import random
            value = value * (1 - noise) + random.uniform(-1, 1) * noise
        samples.append(value * vol * env(i, n))
    return samples


def mix(*tracks):
    length = max(len(t) for t in tracks)
    out = [0.0] * length
    for track in tracks:
        for i, value in enumerate(track):
            out[i] += value
    return [max(-1.0, min(1.0, v)) for v in out]


def silence(dur):
    return [0.0] * int(RATE * dur)


def write(name, samples):
    path = os.path.join(OUT, name)
    os.makedirs(OUT, exist_ok=True)
    with wave.open(path, 'w') as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(RATE)
        frames = b''.join(struct.pack('<h', int(v * 32000)) for v in samples)
        handle.writeframes(frames)
    print(f'  {name} ({len(samples) / RATE:.2f}s)')


SOUNDS = {
    'click.wav': lambda: tone(880, 660, 0.06, 0.35, 'square'),
    'spin.wav': lambda: mix(tone(220, 520, 0.5, 0.28, 'saw'), tone(440, 900, 0.5, 0.12)),
    'reel.wav': lambda: tone(520, 320, 0.08, 0.4, 'square'),
    'coin.wav': lambda: mix(
        tone(988, 988, 0.09, 0.35) + tone(1319, 1319, 0.12, 0.3),
        silence(0.02) + tone(1568, 1568, 0.16, 0.22),
    ),
    'spins.wav': lambda: tone(660, 1320, 0.35, 0.32, 'square'),
    'shield.wav': lambda: mix(tone(300, 700, 0.35, 0.3), tone(150, 350, 0.35, 0.2, 'saw')),
    'attack.wav': lambda: mix(tone(180, 60, 0.45, 0.5, 'saw', noise=0.4), tone(90, 40, 0.45, 0.35)),
    'raid.wav': lambda: mix(tone(120, 320, 0.4, 0.35, 'saw'), tone(600, 240, 0.4, 0.18, 'square')),
    'upgrade.wav': lambda: (
        tone(523, 523, 0.1, 0.3) + tone(659, 659, 0.1, 0.3) + tone(784, 784, 0.22, 0.32)
    ),
    'reward.wav': lambda: (
        tone(659, 659, 0.09, 0.3) + tone(880, 880, 0.09, 0.3) + tone(1175, 1175, 0.26, 0.33)
    ),
    'levelup.wav': lambda: (
        tone(523, 523, 0.1, 0.3)
        + tone(659, 659, 0.1, 0.3)
        + tone(784, 784, 0.1, 0.3)
        + tone(1047, 1047, 0.35, 0.35)
    ),
    'card.wav': lambda: mix(tone(740, 1480, 0.28, 0.3), tone(1480, 2200, 0.28, 0.12)),
    'jackpot.wav': lambda: (
        tone(784, 784, 0.08, 0.3)
        + tone(988, 988, 0.08, 0.3)
        + tone(1175, 1175, 0.08, 0.32)
        + tone(1568, 1568, 0.4, 0.35)
    ),
    'fail.wav': lambda: tone(300, 120, 0.3, 0.28, 'square'),
}

if __name__ == '__main__':
    print('Erzeuge Soundeffekte:')
    for name, factory in SOUNDS.items():
        write(name, factory())
    print('Fertig.')
