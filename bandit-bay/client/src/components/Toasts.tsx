import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../game/GameContext';

export function Toasts(): JSX.Element {
  const { toasts } = useGame();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-50 mx-auto flex w-full max-w-[460px] flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.9 }}
            className={`rounded-2xl border-2 px-4 py-2 font-display text-sm shadow-chunkysm ${
              toast.kind === 'good'
                ? 'border-black/30 bg-gradient-to-b from-[#7fd88a] to-[#3f9a55] text-[#0f2d17]'
                : toast.kind === 'bad'
                  ? 'border-black/30 bg-gradient-to-b from-[#ff9a7b] to-[#d94f36] text-white'
                  : 'border-black/30 bg-gradient-to-b from-[#fdf3dd] to-[#f0dcb4] text-[#3b2a14]'
            }`}
          >
            {toast.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
