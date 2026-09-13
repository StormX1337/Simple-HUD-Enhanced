#!/usr/bin/env python3
"""Erzeugt die Soundeffekte und die Hintergrundmusik für Bandit Bay.

Alles wird synthetisch berechnet (kein fremdes Material) und liegt danach in
client/public/audio. Jede Datei kann durch eine eigene Aufnahme mit gleichem
Namen ersetzt werden.

Start: python3 tools/generate-audio.py
"""
import math
import os
import random
import struct
import wave

RATE = 22050
OUT = os.path.join(os.path.dirname(__file__), '..', 'client', 'public', 'audio')

NOTES = {
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00,
    'A4': 440.00, 'B4': 493.88, 'C5': 523.25, 'D5': 587.33, 'E5': 659.25,
    'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'C6': 1046.50, 'E6': 1318.51,
    'G3': 196.00, 'A3': 220.00, 'F3': 174.61, 'C3': 130.81,
}


def adsr(i, n, attack=0.01, decay=0.2, sustain=0.6, release=0.4):
    """Hüllkurve zwischen 0 und 1."""
    a, d, r = int(n * attack), int(n * decay), int(n * release)
    if i < a:
        return i / max(1, a)
    if i < a + d:
        return 1 - (1 - sustain) * ((i - a) / max(1, d))
    if i > n - r:
        return sustain * max(0.0, (n - i) / max(1, r))
    return sustain


def tone(freq, dur, vol=0.4, partials=(1.0, 0.45, 0.2, 0.08), glide=0.0,
         vibrato=0.0, env=(0.01, 0.2, 0.6, 0.4)):
    """Additiver Ton mit Obertönen, optionalem Glissando und Vibrato."""
    n = max(1, int(RATE * dur))
    out = []
    phases = [0.0] * len(partials)
    for i in range(n):
        t = i / n
        f = freq * (1 + glide * t)
        if vibrato:
            f *= 1 + vibrato * math.sin(2 * math.pi * 5.5 * i / RATE)
        value = 0.0
        for index, amp in enumerate(partials):
            phases[index] += 2 * math.pi * f * (index + 1) / RATE
            value += amp * math.sin(phases[index])
        out.append(value / sum(partials) * vol * adsr(i, n, *env))
    return out


def noise(dur, vol=0.4, cutoff=0.35, env=(0.005, 0.1, 0.4, 0.6)):
    """Gefiltertes Rauschen (einfacher Tiefpass) für Schläge und Graben."""
    n = max(1, int(RATE * dur))
    out = []
    last = 0.0
    for i in range(n):
        raw = random.uniform(-1, 1)
        last += cutoff * (raw - last)
        out.append(last * vol * adsr(i, n, *env))
    return out


def silence(dur):
    return [0.0] * int(RATE * dur)


def mix(*tracks):
    length = max(len(track) for track in tracks)
    out = [0.0] * length
    for track in tracks:
        for i, value in enumerate(track):
            out[i] += value
    return [max(-1.0, min(1.0, value)) for value in out]


def seq(*tracks):
    out = []
    for track in tracks:
        out.extend(track)
    return out


def at(offset, track):
    """Track um offset Sekunden verzögern."""
    return silence(offset) + track


def write(name, samples):
    path = os.path.join(OUT, name)
    os.makedirs(OUT, exist_ok=True)
    with wave.open(path, 'w') as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(RATE)
        frames = b''.join(struct.pack('<h', int(max(-1.0, min(1.0, v)) * 32000)) for v in samples)
        handle.writeframes(frames)
    size = os.path.getsize(path) / 1024
    print(f'  {name:<14} {len(samples) / RATE:5.2f}s  {size:6.0f} KB')


def chord(notes, dur, vol=0.3, **kwargs):
    return mix(*[tone(NOTES[note], dur, vol, **kwargs) for note in notes])


# ---------------------------------------------------------------- Effekte

def s_click():
    return tone(760, 0.05, 0.3, partials=(1.0, 0.3), env=(0.002, 0.05, 0.2, 0.5))


def s_reel():
    return mix(
        noise(0.06, 0.25, cutoff=0.6, env=(0.002, 0.04, 0.1, 0.6)),
        tone(420, 0.07, 0.3, partials=(1.0, 0.6, 0.3), glide=-0.35, env=(0.002, 0.05, 0.2, 0.5)),
    )


def s_spin():
    ticks = []
    position = 0.0
    gap = 0.08
    while position < 0.7:
        ticks.append(at(position, tone(500 + position * 500, 0.05, 0.18, partials=(1.0, 0.4),
                                       env=(0.002, 0.04, 0.2, 0.5))))
        position += gap
        gap *= 0.93
    return mix(tone(220, 0.75, 0.2, partials=(1.0, 0.5, 0.25), glide=1.1), *ticks)


def s_coin():
    return mix(
        tone(NOTES['E6'], 0.12, 0.28, partials=(1.0, 0.5, 0.25), env=(0.002, 0.08, 0.3, 0.5)),
        at(0.05, tone(NOTES['G5'] * 2, 0.16, 0.22, env=(0.002, 0.1, 0.25, 0.6))),
        at(0.02, noise(0.05, 0.08, cutoff=0.9)),
    )


def s_spins():
    return seq(
        tone(NOTES['C5'], 0.09, 0.3),
        tone(NOTES['E5'], 0.09, 0.3),
        tone(NOTES['G5'], 0.09, 0.3),
        tone(NOTES['C6'], 0.24, 0.32, env=(0.01, 0.15, 0.5, 0.5)),
    )


def s_shield():
    return mix(
        chord(['C5', 'G5'], 0.4, 0.22, env=(0.02, 0.25, 0.4, 0.6)),
        at(0.06, tone(NOTES['E6'], 0.3, 0.12, vibrato=0.01)),
    )


def s_attack():
    return mix(
        noise(0.35, 0.5, cutoff=0.2, env=(0.001, 0.12, 0.25, 0.7)),
        tone(90, 0.4, 0.45, partials=(1.0, 0.6, 0.3), glide=-0.5, env=(0.001, 0.15, 0.3, 0.7)),
        at(0.02, noise(0.12, 0.3, cutoff=0.85, env=(0.001, 0.06, 0.1, 0.8))),
    )


def s_raid():
    digs = [at(index * 0.13, noise(0.14, 0.32, cutoff=0.45, env=(0.004, 0.06, 0.2, 0.7)))
            for index in range(3)]
    return mix(tone(120, 0.45, 0.22, glide=0.4, partials=(1.0, 0.4)), *digs)


def s_upgrade():
    return seq(
        mix(tone(NOTES['C5'], 0.12, 0.3), noise(0.06, 0.16, cutoff=0.5)),
        tone(NOTES['E5'], 0.12, 0.3),
        chord(['G5', 'C6'], 0.34, 0.3, env=(0.01, 0.2, 0.5, 0.5)),
    )


def s_reward():
    return seq(
        tone(NOTES['G4'], 0.1, 0.3),
        tone(NOTES['C5'], 0.1, 0.3),
        tone(NOTES['E5'], 0.1, 0.32),
        chord(['G5', 'C6'], 0.4, 0.3, env=(0.01, 0.2, 0.55, 0.5)),
    )


def s_levelup():
    return seq(
        tone(NOTES['C5'], 0.1, 0.3),
        tone(NOTES['E5'], 0.1, 0.3),
        tone(NOTES['G5'], 0.1, 0.3),
        chord(['C6', 'E6'], 0.55, 0.32, env=(0.01, 0.25, 0.6, 0.5)),
    )


def s_card():
    sparkles = [at(0.05 * index, tone(900 + index * 260, 0.14, 0.16, env=(0.003, 0.08, 0.2, 0.7)))
                for index in range(4)]
    return mix(tone(NOTES['A5'], 0.35, 0.22, glide=0.5, vibrato=0.02), *sparkles)


def s_jackpot():
    roll = [at(index * 0.06, tone(NOTES['C5'] * (1 + index * 0.12), 0.09, 0.2)) for index in range(6)]
    return mix(
        seq(silence(0.36),
            tone(NOTES['G5'], 0.12, 0.32),
            tone(NOTES['C6'], 0.12, 0.32),
            chord(['E6', 'G5'], 0.6, 0.34, env=(0.01, 0.25, 0.6, 0.5))),
        *roll,
    )


def s_fail():
    return seq(
        tone(300, 0.12, 0.26, partials=(1.0, 0.5), glide=-0.25),
        tone(200, 0.22, 0.24, partials=(1.0, 0.5), glide=-0.3),
    )


# ---------------------------------------------------------------- Musik

def pluck(freq, dur, vol=0.22):
    return tone(freq, dur, vol, partials=(1.0, 0.5, 0.25, 0.12), env=(0.005, 0.35, 0.25, 0.55))


def bass(freq, dur, vol=0.26):
    return tone(freq, dur, vol, partials=(1.0, 0.35, 0.12), env=(0.01, 0.3, 0.5, 0.4))


def music():
    """Ruhige Insel-Schleife: vier Takte, I–V–vi–IV."""
    beat = 0.42
    progression = [
        ('C3', ['C4', 'E4', 'G4', 'E4']),
        ('G3', ['B4', 'D5', 'G4', 'D5']),
        ('A3', ['A4', 'C5', 'E5', 'C5']),
        ('F3', ['F4', 'A4', 'C5', 'A4']),
    ]
    track = []
    for _ in range(2):  # zwei Durchläufe = ~13 Sekunden
        for root, melody in progression:
            bar = mix(
                bass(NOTES[root], beat * 4, 0.2),
                *[at(index * beat, pluck(NOTES[note], beat * 1.6, 0.16))
                  for index, note in enumerate(melody)],
            )
            track.extend(bar)
    # sanftes Ein- und Ausblenden für die Schleife
    fade = int(RATE * 0.35)
    for i in range(fade):
        track[i] *= i / fade
        track[-1 - i] *= i / fade
    return track


SOUNDS = {
    'click.wav': s_click,
    'reel.wav': s_reel,
    'spin.wav': s_spin,
    'coin.wav': s_coin,
    'spins.wav': s_spins,
    'shield.wav': s_shield,
    'attack.wav': s_attack,
    'raid.wav': s_raid,
    'upgrade.wav': s_upgrade,
    'reward.wav': s_reward,
    'levelup.wav': s_levelup,
    'card.wav': s_card,
    'jackpot.wav': s_jackpot,
    'fail.wav': s_fail,
    'music.wav': music,
}

if __name__ == '__main__':
    random.seed(7)
    print('Erzeuge Audio:')
    for name, factory in SOUNDS.items():
        write(name, factory())
    print('Fertig.')
