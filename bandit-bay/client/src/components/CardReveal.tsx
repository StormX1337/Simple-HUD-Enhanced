import { m } from 'framer-motion';
import { CardArt } from './art/CardArt';
import { formatCoins } from '../lib/format';
import { playSound } from '../lib/sound';
import type { CardDef } from '../types';

interface Props {
  card: CardDef;
  isNew: boolean;
  coins?: number;
  onClose: () => void;
}

export function CardReveal({ card, isNew, coins = 0, onClose }: Props): JSX.Element {
  return (
    <div data-testid="card-reveal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <m.div
        initial={{ scale: 0.6, rotateY: 90, opacity: 0 }}
        animate={{ scale: 1, rotateY: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 16 }}
        className="panel w-full max-w-xs p-4 text-center"
      >
        <div className="font-display text-lg font-black">
          {isNew ? 'Neue Karte!' : 'Karte doppelt'}
        </div>
        <div
          className="mx-auto mt-3 w-40 rounded-2xl border-4 p-2"
          style={{ borderColor: card.color, background: `${card.color}22` }}
        >
          <CardArt art={card.art} color={card.color} size={130} className="mx-auto" />
          <div className="mt-1 font-display text-sm font-bold leading-tight">{card.name}</div>
          <div className="text-xs text-bay-golddark">{'★'.repeat(card.rarity)}</div>
        </div>
        {!isNew && coins > 0 && (
          <div className="mt-3 font-display text-sm">+{formatCoins(coins)} Taler für das Duplikat</div>
        )}
        <button
          type="button"
          data-testid="card-close"
          className="btn-gold mt-4 w-full"
          onClick={() => {
            playSound('click', 0.4);
            onClose();
          }}
        >
          Super!
        </button>
      </m.div>
    </div>
  );
}
