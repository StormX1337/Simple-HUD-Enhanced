import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatCoins } from '../lib/format';
import { CoinIcon } from './art/HudIcons';

interface Props {
  amount: number;
  onDone: () => void;
}

const CONFETTI = ['#f8c73c', '#ff8a6b', '#8ee06a', '#7cc6fe', '#c792ea', '#ffe9a0'];

/** Kurze Feier-Einblendung bei drei gleichen Taler-Symbolen. */
export function BigWin({ amount, onDone }: Props): JSX.Element {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 2000);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      data-testid="big-win"
      className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-black/55"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDone}
    >
      {/* Strahlenkranz */}
      <motion.div
        className="absolute h-[520px] w-[520px]"
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        style={{
          background:
            'repeating-conic-gradient(rgba(248,199,60,0.35) 0deg 10deg, transparent 10deg 20deg)',
          maskImage: 'radial-gradient(circle, #000 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle, #000 30%, transparent 70%)',
        }}
      />

      {/* Konfetti */}
      {[...Array(18)].map((_, index) => (
        <motion.span
          key={index}
          className="absolute h-2.5 w-2.5 rounded-[2px]"
          style={{ background: CONFETTI[index % CONFETTI.length] }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: (index % 2 ? 1 : -1) * (40 + (index % 6) * 32),
            y: -60 - (index % 5) * 45,
            opacity: 0,
            rotate: 360,
          }}
          transition={{ duration: 1.4, delay: index * 0.03 }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.5, rotate: -8, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 13 }}
        className="relative flex flex-col items-center"
      >
        <div className="logo-title font-display text-4xl font-black">GROSSER</div>
        <div className="logo-title -mt-2 font-display text-5xl font-black">GEWINN!</div>
        <div className="mt-3 flex items-center gap-2 rounded-full border-[3px] border-[#7a4a05] bg-gradient-to-b from-[#ffe9a0] via-[#f8c73c] to-[#e0a21a] px-5 py-2 shadow-[0_6px_0_rgba(0,0,0,0.35)]">
          <CoinIcon size={30} />
          <span className="font-display text-2xl font-black text-[#4a2f05]">
            +{formatCoins(amount)}
          </span>
        </div>
        <div className="mt-3 text-xs font-bold text-white/70">Tippen zum Fortfahren</div>
      </motion.div>
    </motion.div>
  );
}
