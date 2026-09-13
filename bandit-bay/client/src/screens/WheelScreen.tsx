import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useGame } from '../game/GameContext';
import { api, errorText } from '../lib/api';
import { formatCoins, formatDuration } from '../lib/format';
import { playSound } from '../lib/sound';
import { CardArt } from '../components/art/CardArt';
import { CoinIcon, ShieldIcon, SpinIcon } from '../components/art/HudIcons';
import type { WheelResult, WheelStatus } from '../types';

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = CENTER - 10;

/** Kreissektor als SVG-Pfad. */
function sector(index: number, count: number): string {
  const angle = (2 * Math.PI) / count;
  const start = index * angle - Math.PI / 2 - angle / 2;
  const end = start + angle;
  const x1 = CENTER + RADIUS * Math.cos(start);
  const y1 = CENTER + RADIUS * Math.sin(start);
  const x2 = CENTER + RADIUS * Math.cos(end);
  const y2 = CENTER + RADIUS * Math.sin(end);
  return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 0 1 ${x2} ${y2} Z`;
}

export function WheelScreen(): JSX.Element {
  const { applyState, pushToast, refresh } = useGame();
  const [wheel, setWheel] = useState<WheelStatus | null>(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<WheelResult | null>(null);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await api.wheel();
      setWheel(data.wheel);
      applyState(data.state);
    } catch {
      pushToast('Glücksrad konnte nicht geladen werden', 'bad');
    }
  }, [applyState, pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const spin = async () => {
    if (!wheel || spinning || !wheel.canSpin) return;
    setSpinning(true);
    setResult(null);
    playSound('spin', 0.55);
    try {
      const data = await api.spinWheel();
      const count = wheel.segments.length;
      const segmentAngle = 360 / count;
      // Vier volle Umdrehungen, dann genau auf das gezogene Feld.
      const target = 360 * 4 + (360 - data.index * segmentAngle);
      setRotation((current) => current + target - (current % 360));
      window.setTimeout(() => {
        setResult(data);
        setWheel(data.wheel);
        applyState(data.state);
        setSpinning(false);
        playSound(data.segment.kind === 'jackpot' ? 'jackpot' : 'reward', 0.8);
        if (data.levelUps > 0) playSound('levelup', 0.7);
        void refresh();
      }, 3700);
    } catch (error) {
      setSpinning(false);
      playSound('fail', 0.4);
      pushToast(errorText(error, 'Drehen fehlgeschlagen'), 'bad');
      void load();
    }
  };

  if (!wheel) return <div className="p-4 text-center">Lädt …</div>;

  const count = wheel.segments.length;
  const segmentAngle = 360 / count;
  const seconds = Math.max(0, wheel.secondsUntilNext - tick);

  return (
    <div className="space-y-3">
      <div className="panel-dark p-3 text-center">
        <div className="font-display text-lg font-black">Glücksrad</div>
        <div className="text-xs text-white/70">
          {wheel.canSpin
            ? 'Einmal pro Tag kostenlos drehen!'
            : `Nächste Drehung in ${formatDuration(seconds)}`}
        </div>
      </div>

      <div className="relative mx-auto" style={{ width: SIZE, height: SIZE + 18 }}>
        {/* Zeiger */}
        <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
          <svg viewBox="0 0 40 34" width="34" height="29" aria-hidden="true">
            <path d="M20 32 4 6h32z" fill="#e0533c" stroke="#3b2412" strokeWidth="3" strokeLinejoin="round" />
            <circle cx="20" cy="10" r="4" fill="#ffe9a0" stroke="#3b2412" strokeWidth="2" />
          </svg>
        </div>

        <m.div
          className="absolute inset-x-0 top-3"
          animate={{ rotate: rotation }}
          transition={{ duration: 3.6, ease: [0.16, 0.72, 0.16, 1] }}
          style={{ width: SIZE, height: SIZE }}
        >
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE}>
            <circle cx={CENTER} cy={CENTER} r={RADIUS + 6} fill="#7a441c" stroke="#3b2412" strokeWidth="6" />
            {wheel.segments.map((segment, index) => (
              <g key={segment.id}>
                <path d={sector(index, count)} fill={segment.color} stroke="#3b2412" strokeWidth="3" />
                <g
                  transform={`rotate(${index * segmentAngle} ${CENTER} ${CENTER}) translate(${CENTER} ${CENTER - RADIUS * 0.6}) rotate(${
                    index * segmentAngle > 90 && index * segmentAngle < 270 ? 180 : 0
                  })`}
                >
                  <text
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="800"
                    fill="#3b2412"
                    fontFamily="'Baloo 2', sans-serif"
                  >
                    {segment.kind === 'coins' || segment.kind === 'jackpot'
                      ? formatCoins(segment.amount)
                      : segment.label}
                  </text>
                  <text
                    y="15"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="#5e3208"
                    fontFamily="'Baloo 2', sans-serif"
                  >
                    {segment.kind === 'jackpot'
                      ? 'JACKPOT'
                      : segment.kind === 'coins'
                        ? 'Taler'
                        : ''}
                  </text>
                </g>
              </g>
            ))}
            <circle cx={CENTER} cy={CENTER} r="26" fill="#f8c73c" stroke="#3b2412" strokeWidth="4" />
            <circle cx={CENTER} cy={CENTER} r="14" fill="#ffe9a0" stroke="#c8900f" strokeWidth="3" />
          </svg>
        </m.div>
      </div>

      <button
        type="button"
        data-testid="wheel-spin"
        disabled={!wheel.canSpin || spinning}
        onClick={() => void spin()}
        className="btn-gold w-full py-3 text-lg"
      >
        {spinning ? 'Dreht …' : wheel.canSpin ? 'Rad drehen!' : 'Heute schon gedreht'}
      </button>

      <div className="panel p-3 text-[12px]">
        <div className="mb-1 font-display text-base font-bold">Mögliche Gewinne</div>
        <div className="grid grid-cols-2 gap-1.5">
          {wheel.segments.map((segment) => (
            <div key={segment.id} className="flex items-center gap-1.5 rounded-xl bg-black/5 px-2 py-1">
              <span
                className="h-3 w-3 shrink-0 rounded-full border border-black/30"
                style={{ background: segment.color }}
              />
              <span className="truncate font-bold">
                {segment.kind === 'coins' || segment.kind === 'jackpot'
                  ? `${formatCoins(segment.amount)} Taler`
                  : segment.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <m.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setResult(null)}
          >
            <m.div
              initial={{ scale: 0.7, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="panel w-full max-w-xs p-4 text-center"
            >
              <div className="font-display text-xl font-black">
                {result.segment.kind === 'jackpot' ? 'JACKPOT!' : 'Gewonnen!'}
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 font-display text-2xl font-black">
                {result.coins > 0 && (
                  <>
                    <CoinIcon size={30} /> {formatCoins(result.coins)}
                  </>
                )}
                {result.spins > 0 && (
                  <>
                    <SpinIcon size={30} /> {result.spins}
                  </>
                )}
                {result.shields > 0 && (
                  <>
                    <ShieldIcon size={30} /> {result.shields}
                  </>
                )}
              </div>
              {result.card && (
                <div className="mx-auto mt-2 w-32 rounded-2xl border-4 p-1" style={{ borderColor: result.card.card.color }}>
                  <CardArt art={result.card.card.art} color={result.card.card.color} size={100} className="mx-auto" />
                  <div className="text-[11px] font-bold">{result.card.card.name}</div>
                  <div className="text-[10px] font-black text-[#c98c14]">
                    {result.card.isNew ? 'NEU' : `+${formatCoins(result.card.coins)} Taler`}
                  </div>
                </div>
              )}
              <button type="button" className="btn-gold mt-4 w-full" onClick={() => setResult(null)}>
                Super!
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
