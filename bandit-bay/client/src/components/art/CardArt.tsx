import type { CardArt as CardArtKind } from '../../types';

interface Props {
  art: CardArtKind;
  color: string;
  size?: number;
  className?: string;
}

/** Motive der Sammelkarten – ebenfalls komplett eigene SVGs. */
export function CardArt({ art, color, size = 72, className = '' }: Props): JSX.Element {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`bg-${art}`} cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor={color} stopOpacity="0.95" />
        </radialGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="10"
        fill={`url(#bg-${art})`}
        stroke="#3b2412"
        strokeWidth="2.5"
      />
      <g stroke="#3b2412" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      {art === 'raccoon' && (
        <g>
          <circle cx="32" cy="34" r="16" fill="#b6c0d4" />
          <circle cx="20" cy="22" r="6" fill="#9aa6bd" />
          <circle cx="44" cy="22" r="6" fill="#9aa6bd" />
          <path d="M17 33c3-5 9-6 13-3-1 5-5 8-10 8-2 0-4-2-3-5z" fill="#3a4457" />
          <path d="M47 33c-3-5-9-6-13-3 1 5 5 8 10 8 2 0 4-2 3-5z" fill="#3a4457" />
          <circle cx="25" cy="33" r="2.5" fill="#fff" />
          <circle cx="39" cy="33" r="2.5" fill="#fff" />
          <ellipse cx="32" cy="43" rx="9" ry="7" fill="#f2f4f9" />
          <path d="M32 39l3 3-3 3-3-3z" fill="#1c2231" />
        </g>
      )}
      {art === 'ship' && (
        <g>
          <path d="M12 42h40l-6 12H18z" fill="#8b5a2b" />
          <rect x="30" y="12" width="3" height="30" fill="#6b4a22" />
          <path d="M33 14h16l-16 14z" fill="#fff8e7" />
          <path d="M30 18L16 30l14 10z" fill="#ffd6a5" />
          <path d="M10 54h44" stroke="#2f6f9e" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {art === 'map' && (
        <g>
          <path d="M12 14l14 6 12-6 14 6v32l-14-6-12 6-14-6z" fill="#f3e2bd" stroke="#a9834a" strokeWidth="2" />
          <path d="M26 20v32M38 14v32" stroke="#c9b087" strokeWidth="2" />
          <path d="M18 34c6-8 14-4 18-10" stroke="#d9552f" strokeWidth="2" strokeDasharray="3 3" fill="none" />
          <path d="M42 24l4 4-4 4-4-4z" fill="#d9552f" />
        </g>
      )}
      {art === 'gem' && (
        <g>
          <path d="M20 18h24l10 12-22 24-22-24z" fill="#ffffff" opacity="0.85" />
          <path d="M20 18l-10 12h44L44 18z" fill={color} />
          <path d="M32 54L10 30h44z" fill={color} opacity="0.75" />
          <path d="M26 30l6-12 6 12-6 24z" fill="#ffffff" opacity="0.55" />
        </g>
      )}
      {art === 'fish' && (
        <g>
          <path d="M12 32c8-12 26-12 34 0-8 12-26 12-34 0z" fill="#7cc6fe" />
          <path d="M46 32l10-8v16z" fill="#2f7fd0" />
          <circle cx="22" cy="30" r="3" fill="#fff" />
          <circle cx="22" cy="30" r="1.4" fill="#1c2231" />
          <path d="M28 24c4 4 4 12 0 16" stroke="#2f7fd0" strokeWidth="2" fill="none" />
        </g>
      )}
      {art === 'lantern' && (
        <g>
          <rect x="26" y="10" width="12" height="5" rx="2" fill="#8b5a2b" />
          <path d="M22 16h20l4 26a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6z" fill="#ffe9a8" />
          <path d="M26 20h12l3 22H23z" fill="#f6c343" />
          <rect x="28" y="48" width="8" height="6" rx="2" fill="#8b5a2b" />
        </g>
      )}
      {art === 'mask' && (
        <g>
          <path d="M18 12h28l4 24c0 12-8 18-18 18s-18-6-18-18z" fill="#e6cfa4" stroke="#8b5a2b" strokeWidth="2" />
          <path d="M22 28c4-4 8-4 10 0-2 4-6 6-10 4z" fill="#3a4457" />
          <path d="M42 28c-4-4-8-4-10 0 2 4 6 6 10 4z" fill="#3a4457" />
          <path d="M26 42c4 3 8 3 12 0" stroke="#8b5a2b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M32 30v8" stroke="#8b5a2b" strokeWidth="2" />
        </g>
      )}
      {art === 'crown' && (
        <g>
          <path d="M12 40l-2-22 12 10 10-16 10 16 12-10-2 22z" fill="#f6c343" stroke="#c98c14" strokeWidth="2" />
          <rect x="12" y="42" width="40" height="8" rx="3" fill="#c98c14" />
          <circle cx="22" cy="34" r="3" fill={color} />
          <circle cx="32" cy="32" r="3.5" fill={color} />
          <circle cx="42" cy="34" r="3" fill={color} />
        </g>
      )}
      {art === 'leaf' && (
        <g>
          <path d="M14 50C14 24 32 12 52 12c0 24-16 38-38 38z" fill="#4fa86b" />
          <path d="M20 46C28 30 38 22 48 18" stroke="#2b6b45" strokeWidth="2.5" fill="none" />
          <path d="M30 38c2-6 6-9 10-11M26 44c1-4 3-7 6-9" stroke="#2b6b45" strokeWidth="2" fill="none" />
        </g>
      )}
      {art === 'star' && (
        <g>
          <path
            d="M32 8l7 16 18 2-13 12 4 17-16-9-16 9 4-17-13-12 18-2z"
            fill="#ffe9a8"
            stroke="#f6c343"
            strokeWidth="2"
          />
          <circle cx="32" cy="30" r="5" fill={color} />
        </g>
      )}
      </g>
    </svg>
  );
}
