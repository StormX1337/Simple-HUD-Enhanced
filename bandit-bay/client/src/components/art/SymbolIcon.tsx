import type { SymbolId } from '../../types';

interface Props {
  id: SymbolId;
  size?: number;
  className?: string;
}

const OUTLINE = '#3b2412';

/**
 * Slot-Symbole im Cartoon-Stil: dicke dunkle Konturen, satte Farben,
 * Verlauf von hell nach dunkel und ein Glanzlicht – alles eigene SVGs.
 */
export function SymbolIcon({ id, size = 64, className = '' }: Props): JSX.Element {
  const uid = `sym-${id}`;
  return (
    <svg
      viewBox="0 0 72 72"
      width={size}
      height={size}
      className={className}
      style={{ filter: 'drop-shadow(0 3px 2px rgba(0,0,0,0.35))' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe9a0" />
          <stop offset="45%" stopColor="#f8c73c" />
          <stop offset="100%" stopColor="#d18b0c" />
        </linearGradient>
        <linearGradient id={`${uid}-blue`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a9e1ff" />
          <stop offset="55%" stopColor="#48a6f0" />
          <stop offset="100%" stopColor="#1f5fae" />
        </linearGradient>
        <linearGradient id={`${uid}-green`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c6f08a" />
          <stop offset="50%" stopColor="#66c14c" />
          <stop offset="100%" stopColor="#2c7a35" />
        </linearGradient>
        <linearGradient id={`${uid}-steel`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd2c0" />
          <stop offset="40%" stopColor="#ff7f56" />
          <stop offset="100%" stopColor="#b83b1c" />
        </linearGradient>
        <linearGradient id={`${uid}-purple`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e7c8ff" />
          <stop offset="50%" stopColor="#a476ee" />
          <stop offset="100%" stopColor="#5f36a8" />
        </linearGradient>
        <linearGradient id={`${uid}-wood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c98a4b" />
          <stop offset="100%" stopColor="#7a441c" />
        </linearGradient>
      </defs>

      {id === 'taler' && (
        <g>
          <ellipse cx="36" cy="42" rx="27" ry="25" fill="#a96a05" stroke={OUTLINE} strokeWidth="3" />
          <ellipse cx="36" cy="36" rx="27" ry="25" fill={`url(#${uid}-gold)`} stroke={OUTLINE} strokeWidth="3" />
          <ellipse cx="36" cy="36" rx="19" ry="17" fill="none" stroke="#c8900f" strokeWidth="3" />
          <g fill="#b97c08">
            <ellipse cx="36" cy="40" rx="8" ry="6.5" />
            <ellipse cx="28" cy="30" rx="3.4" ry="4.2" />
            <ellipse cx="33" cy="27" rx="3.4" ry="4.2" />
            <ellipse cx="39" cy="27" rx="3.4" ry="4.2" />
            <ellipse cx="44" cy="30" rx="3.4" ry="4.2" />
          </g>
          <path d="M18 26c3-6 9-9 15-9" stroke="#fff6d0" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.85" />
          <path d="M57 20l1.6 4.2 4.4 1.5-4.4 1.6L57 32l-1.6-3.7-4.4-1.6 4.4-1.5z" fill="#fff6d0" />
        </g>
      )}

      {id === 'beutel' && (
        <g>
          <path
            d="M22 28h28l7 24c1.6 6-3 11-9 11H24c-6 0-10.6-5-9-11z"
            fill={`url(#${uid}-blue)`}
            stroke={OUTLINE}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M26 33h20l4 14H22z" fill="#7fc8fb" opacity="0.6" />
          <path
            d="M24 28c0-9 5-15 12-15s12 6 12 15"
            fill="none"
            stroke={OUTLINE}
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          <ellipse cx="36" cy="28" rx="15" ry="4.5" fill="#2f7fd0" stroke={OUTLINE} strokeWidth="3" />
          <circle cx="36" cy="48" r="11" fill={`url(#${uid}-gold)`} stroke={OUTLINE} strokeWidth="3" />
          <path
            d="M36 42a6 6 0 1 1-5.6 4"
            fill="none"
            stroke="#8a5c05"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M29 45l-3.5 1.5 1-4z" fill="#8a5c05" />
        </g>
      )}

      {id === 'schild' && (
        <g>
          <path
            d="M36 6l25 8v21c0 15-10 25-25 31-15-6-25-16-25-31V14z"
            fill={`url(#${uid}-green)`}
            stroke={OUTLINE}
            strokeWidth="3.4"
            strokeLinejoin="round"
          />
          <path d="M36 12l19 6v17c0 12-8 20-19 25-11-5-19-13-19-25V18z" fill="none" stroke="#f8c73c" strokeWidth="3" />
          <path d="M36 12v48c-11-5-19-13-19-25V18z" fill="#ffffff" opacity="0.16" />
          <g fill="#1f5c28">
            <ellipse cx="36" cy="40" rx="7" ry="6" />
            <ellipse cx="29" cy="31" rx="3" ry="3.8" />
            <ellipse cx="36" cy="28" rx="3" ry="3.8" />
            <ellipse cx="43" cy="31" rx="3" ry="3.8" />
          </g>
        </g>
      )}

      {id === 'hammer' && (
        <g>
          <rect x="31" y="28" width="10" height="38" rx="5" fill={`url(#${uid}-wood)`} stroke={OUTLINE} strokeWidth="3" />
          <path d="M34 34v24" stroke="#e0ab6c" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
          <path
            d="M12 14h48a5 5 0 0 1 5 5v13a5 5 0 0 1-5 5H12a5 5 0 0 1-5-5V19a5 5 0 0 1 5-5z"
            fill={`url(#${uid}-steel)`}
            stroke={OUTLINE}
            strokeWidth="3.4"
            strokeLinejoin="round"
          />
          <rect x="12" y="18" width="48" height="6" rx="3" fill="#ffd2c0" opacity="0.7" />
          <rect x="26" y="12" width="20" height="27" rx="4" fill="#f8c73c" stroke={OUTLINE} strokeWidth="3" />
          <circle cx="36" cy="25" r="3.4" fill="#a96a05" />
        </g>
      )}

      {id === 'pfote' && (
        <g>
          <ellipse cx="36" cy="47" rx="18" ry="15" fill={`url(#${uid}-purple)`} stroke={OUTLINE} strokeWidth="3.2" />
          <ellipse cx="36" cy="45" rx="12" ry="9.5" fill="#f0d8ff" opacity="0.55" />
          <g fill={`url(#${uid}-purple)`} stroke={OUTLINE} strokeWidth="3">
            <ellipse cx="15" cy="30" rx="7" ry="8.5" />
            <ellipse cx="28" cy="19" rx="7" ry="8.5" />
            <ellipse cx="44" cy="19" rx="7" ry="8.5" />
            <ellipse cx="57" cy="30" rx="7" ry="8.5" />
          </g>
        </g>
      )}

      {id === 'joker' && (
        <g>
          <circle cx="36" cy="36" r="30" fill={`url(#${uid}-gold)`} stroke={OUTLINE} strokeWidth="3" />
          <circle cx="36" cy="36" r="23" fill="#fff3c9" opacity="0.35" />
          {/* Banditenmaske */}
          <path
            d="M8 34c10-14 26-16 36-9-3 13-12 23-25 24-7 0-12-7-11-15z"
            fill="#38415a"
            stroke={OUTLINE}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M64 34c-10-14-26-16-36-9 3 13 12 23 25 24 7 0 12-7 11-15z"
            fill="#38415a"
            stroke={OUTLINE}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="33" r="7" fill="#ffffff" stroke={OUTLINE} strokeWidth="2.4" />
          <circle cx="48" cy="33" r="7" fill="#ffffff" stroke={OUTLINE} strokeWidth="2.4" />
          <circle cx="25" cy="34" r="3.4" fill="#1c2231" />
          <circle cx="49" cy="34" r="3.4" fill="#1c2231" />
          <path d="M36 46l6 5-6 5-6-5z" fill="#1c2231" />
          <path d="M20 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fff6d0" />
        </g>
      )}

      {id === 'truhe' && (
        <g>
          <path
            d="M10 34c0-12 11-20 26-20s26 8 26 20z"
            fill="#e0555f"
            stroke={OUTLINE}
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <path d="M15 31c2-8 10-13 21-13s19 5 21 13z" fill="#ff8790" />
          <rect x="8" y="32" width="56" height="10" rx="3" fill="#f8c73c" stroke={OUTLINE} strokeWidth="3" />
          <path
            d="M10 42h52v16a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6z"
            fill={`url(#${uid}-wood)`}
            stroke={OUTLINE}
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <rect x="14" y="46" width="44" height="5" rx="2.5" fill="#e0ab6c" opacity="0.65" />
          <rect x="30" y="30" width="12" height="20" rx="4" fill="#f8c73c" stroke={OUTLINE} strokeWidth="3" />
          <circle cx="36" cy="41" r="3" fill="#7a441c" />
          <circle cx="14" cy="20" r="4" fill="#ffe9a0" opacity="0.9" />
          <circle cx="58" cy="22" r="3" fill="#ffe9a0" opacity="0.9" />
        </g>
      )}
    </svg>
  );
}
