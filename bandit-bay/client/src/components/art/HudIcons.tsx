interface IconProps {
  size?: number;
  className?: string;
}

const OUTLINE = '#3b2412';

/** Goldtaler für die Kopfleiste. */
export function CoinIcon({ size = 22, className = '' }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="hud-coin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe9a0" />
          <stop offset="50%" stopColor="#f8c73c" />
          <stop offset="100%" stopColor="#d18b0c" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="17" r="13" fill="#a96a05" stroke={OUTLINE} strokeWidth="2" />
      <circle cx="16" cy="15" r="13" fill="url(#hud-coin)" stroke={OUTLINE} strokeWidth="2" />
      <circle cx="16" cy="15" r="8" fill="none" stroke="#c8900f" strokeWidth="2" />
      <g fill="#b97c08">
        <ellipse cx="16" cy="17" rx="3.6" ry="3" />
        <ellipse cx="12.4" cy="12.6" rx="1.6" ry="2" />
        <ellipse cx="16" cy="11.2" rx="1.6" ry="2" />
        <ellipse cx="19.6" cy="12.6" rx="1.6" ry="2" />
      </g>
    </svg>
  );
}

/** Drehungen-Symbol (Pfeil im Kreis auf blauem Grund). */
export function SpinIcon({ size = 22, className = '' }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="hud-spin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a9e1ff" />
          <stop offset="55%" stopColor="#48a6f0" />
          <stop offset="100%" stopColor="#1f5fae" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="13" fill="url(#hud-spin)" stroke={OUTLINE} strokeWidth="2" />
      <path
        d="M16 8.5a7.5 7.5 0 1 1-7 4.8"
        fill="none"
        stroke="#fff6d0"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path d="M9.4 9.2l1.2 5.4-5.2-1.6z" fill="#fff6d0" />
    </svg>
  );
}

/** Schild-Symbol für die Kopfleiste. */
export function ShieldIcon({ size = 22, className = '', active = true }: IconProps & { active?: boolean }): JSX.Element {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="hud-shield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c6f08a" />
          <stop offset="55%" stopColor="#66c14c" />
          <stop offset="100%" stopColor="#2c7a35" />
        </linearGradient>
      </defs>
      <path
        d="M16 3l12 4v10c0 7.5-5 12.5-12 15.5C9 29.5 4 24.5 4 17V7z"
        fill={active ? 'url(#hud-shield)' : '#4a5568'}
        stroke={OUTLINE}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {active && (
        <>
          <path d="M16 6.5l8.6 2.9V17c0 5.6-3.6 9.4-8.6 11.7z" fill="#000" opacity="0.12" />
          <path d="M11 16.5l3.6 3.8L21 13" fill="none" stroke="#eaffd0" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

/** Stern für Erfahrung / Level. */
export function StarIcon({ size = 20, className = '' }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true">
      <path
        d="M16 3l4 9 10 1-7.4 6.6 2.2 9.7L16 24.4 7.2 29.3l2.2-9.7L2 13l10-1z"
        fill="#f8c73c"
        stroke={OUTLINE}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M16 7l2.6 6 6.4.7-4.8 4.2 1.4 6.3L16 21z" fill="#ffe9a0" />
    </svg>
  );
}

/** Kleines Kartensymbol (Sammlung). */
export function CardIcon({ size = 22, className = '' }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true">
      <rect x="4" y="7" width="15" height="21" rx="3" fill="#8d7ae6" stroke={OUTLINE} strokeWidth="2" transform="rotate(-12 11 17)" />
      <rect x="12" y="5" width="16" height="22" rx="3" fill="#ffd6e4" stroke={OUTLINE} strokeWidth="2" transform="rotate(9 20 16)" />
      <circle cx="21" cy="15" r="4.4" fill="#f8c73c" stroke={OUTLINE} strokeWidth="1.8" />
    </svg>
  );
}
