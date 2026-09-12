import type { SymbolId } from '../../types';

interface Props {
  id: SymbolId;
  size?: number;
  className?: string;
}

/** Eigene Slot-Symbole als SVG – keine fremden Assets. */
export function SymbolIcon({ id, size = 64, className = '' }: Props): JSX.Element {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      {id === 'taler' && (
        <g>
          <circle cx="32" cy="32" r="24" fill="#c98c14" />
          <circle cx="32" cy="30" r="22" fill="#f6c343" />
          <circle cx="32" cy="30" r="16" fill="#ffdf83" />
          <path
            d="M32 19c3 4 6 5 9 5-2 3-2 7 0 10-4 0-7 2-9 6-2-4-5-6-9-6 2-3 2-7 0-10 3 0 6-1 9-5z"
            fill="#c98c14"
          />
          <circle cx="26" cy="24" r="3" fill="#fff3c9" opacity="0.8" />
        </g>
      )}
      {id === 'beutel' && (
        <g>
          <path d="M20 24h24l6 26a6 6 0 0 1-6 7H20a6 6 0 0 1-6-7z" fill="#2f7fd0" />
          <path d="M22 26h20l5 22a4 4 0 0 1-4 5H21a4 4 0 0 1-4-5z" fill="#7cc6fe" />
          <path d="M22 24c0-8 4-13 10-13s10 5 10 13" fill="none" stroke="#1b4e82" strokeWidth="4" />
          <path
            d="M32 33a9 9 0 1 1-8 5"
            fill="none"
            stroke="#fff8e7"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path d="M22 36l4 5-7 1z" fill="#fff8e7" />
        </g>
      )}
      {id === 'schild' && (
        <g>
          <path d="M32 8l20 7v18c0 12-8 20-20 24-12-4-20-12-20-24V15z" fill="#2f6b3e" />
          <path d="M32 12l16 6v15c0 10-6 16-16 20-10-4-16-10-16-20V18z" fill="#9fd356" />
          <path d="M32 18v32c-7-3-11-8-11-16V21z" fill="#7bbb42" />
          <path d="M25 31l5 6 10-11" fill="none" stroke="#1d4023" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      {id === 'hammer' && (
        <g>
          <rect x="28" y="26" width="8" height="30" rx="4" fill="#8b5a2b" />
          <rect x="29" y="30" width="3" height="22" rx="1.5" fill="#c08b53" />
          <path d="M14 14h36a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4z" fill="#d9552f" />
          <path d="M16 16h32v6H16z" fill="#ff8a5b" />
          <path d="M10 20h6v8h-6z" fill="#a33a1c" />
        </g>
      )}
      {id === 'pfote' && (
        <g>
          <ellipse cx="32" cy="40" rx="15" ry="13" fill="#8d7ae6" />
          <ellipse cx="32" cy="39" rx="11" ry="9" fill="#c792ea" />
          <ellipse cx="17" cy="25" rx="6" ry="7" fill="#8d7ae6" />
          <ellipse cx="27" cy="17" rx="6" ry="7" fill="#8d7ae6" />
          <ellipse cx="38" cy="17" rx="6" ry="7" fill="#8d7ae6" />
          <ellipse cx="47" cy="26" rx="6" ry="7" fill="#8d7ae6" />
        </g>
      )}
      {id === 'truhe' && (
        <g>
          <path d="M12 28h40v22a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z" fill="#8b5a2b" />
          <path d="M14 32h36v18H14z" fill="#c08b53" />
          <path d="M12 28c0-9 9-15 20-15s20 6 20 15z" fill="#ffb0c8" />
          <path d="M16 27c1-6 8-10 16-10s15 4 16 10z" fill="#ffd6e4" />
          <rect x="28" y="26" width="8" height="14" rx="3" fill="#f6c343" />
          <circle cx="32" cy="33" r="2.5" fill="#8b5a2b" />
        </g>
      )}
    </svg>
  );
}
