const OUTLINE = '#2f4f2a';

interface Props {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** Palme für die Inselkulisse. */
export function Palm({ size = 70, className = '', style }: Props): JSX.Element {
  return (
    <svg viewBox="0 0 60 80" width={size} height={size * 1.33} className={className} style={style} aria-hidden="true">
      <path
        d="M30 78c-2-18-3-30 1-44"
        stroke="#8a5c2c"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M30 78c-2-18-3-30 1-44" stroke="#b5834a" strokeWidth="3" strokeLinecap="round" fill="none" />
      <g stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round">
        <path d="M31 34c-9-10-20-11-27-5 10-1 17 2 22 8z" fill="#4fae5c" />
        <path d="M31 34c9-10 20-11 27-5-10-1-17 2-22 8z" fill="#3f9a4f" />
        <path d="M31 33c-4-12-13-19-22-19 8 5 13 11 16 21z" fill="#5cc169" />
        <path d="M31 33c4-12 13-19 22-19-8 5-13 11-16 21z" fill="#46a355" />
      </g>
      <circle cx="28" cy="36" r="3.4" fill="#c8641f" stroke={OUTLINE} strokeWidth="1.6" />
      <circle cx="34" cy="38" r="3" fill="#e0782c" stroke={OUTLINE} strokeWidth="1.6" />
    </svg>
  );
}

/** Busch / Gras-Tuff. */
export function Bush({ size = 40, className = '', style }: Props): JSX.Element {
  return (
    <svg viewBox="0 0 60 40" width={size} height={size * 0.66} className={className} style={style} aria-hidden="true">
      <g stroke={OUTLINE} strokeWidth="2.4" strokeLinejoin="round">
        <ellipse cx="18" cy="28" rx="15" ry="11" fill="#4aa85a" />
        <ellipse cx="38" cy="26" rx="17" ry="13" fill="#57bd66" />
        <ellipse cx="29" cy="20" rx="12" ry="10" fill="#68d073" />
      </g>
      <circle cx="24" cy="22" r="2.6" fill="#ff7fa4" />
      <circle cx="41" cy="24" r="2.4" fill="#ffd95e" />
    </svg>
  );
}

/** Felsen am Strand. */
export function Rock({ size = 42, className = '', style }: Props): JSX.Element {
  return (
    <svg viewBox="0 0 60 40" width={size} height={size * 0.66} className={className} style={style} aria-hidden="true">
      <path
        d="M6 34c2-12 10-20 20-20s20 7 26 20z"
        fill="#9aa2ad"
        stroke="#4c545e"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path d="M14 30c2-8 7-13 14-13-5 4-8 8-9 13z" fill="#c2c9d2" />
    </svg>
  );
}

/** Segelboot auf dem Wasser. */
export function Boat({ size = 60, className = '', style }: Props): JSX.Element {
  return (
    <svg viewBox="0 0 60 50" width={size} height={size * 0.83} className={className} style={style} aria-hidden="true">
      <path d="M8 34h44l-7 11H15z" fill="#c8641f" stroke="#5e2f0c" strokeWidth="2.4" strokeLinejoin="round" />
      <rect x="28" y="8" width="3.4" height="26" fill="#7a441c" />
      <path d="M31 10h16l-16 20z" fill="#fff6e2" stroke="#5e2f0c" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M28 12L14 30h14z" fill="#ffd6a5" stroke="#5e2f0c" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

/** Sonne mit Strahlen. */
export function Sun({ size = 74, className = '', style }: Props): JSX.Element {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} style={style} aria-hidden="true">
      <circle cx="40" cy="40" r="30" fill="#fff3b0" opacity="0.35" />
      <circle cx="40" cy="40" r="22" fill="#ffe066" opacity="0.55" />
      <circle cx="40" cy="40" r="16" fill="#ffd11a" />
      <circle cx="34" cy="34" r="5" fill="#fff6d0" opacity="0.8" />
    </svg>
  );
}

/** Wolke. */
export function Cloud({ size = 90, className = '', style }: Props): JSX.Element {
  return (
    <svg viewBox="0 0 120 60" width={size} height={size * 0.5} className={className} style={style} aria-hidden="true">
      <g fill="#ffffff">
        <ellipse cx="38" cy="38" rx="26" ry="18" />
        <ellipse cx="66" cy="30" rx="30" ry="22" />
        <ellipse cx="92" cy="40" rx="22" ry="15" />
      </g>
      <g fill="#dceaf7">
        <ellipse cx="40" cy="46" rx="24" ry="9" />
        <ellipse cx="86" cy="47" rx="20" ry="8" />
      </g>
    </svg>
  );
}

/** Ferne Insel am Horizont. */
export function FarIsland({ size = 90, className = '', style }: Props): JSX.Element {
  return (
    <svg viewBox="0 0 120 50" width={size} height={size * 0.42} className={className} style={style} aria-hidden="true">
      <path d="M4 44c8-20 22-32 40-32 20 0 36 12 44 32z" fill="#3d7f8f" opacity="0.55" />
      <path d="M28 44c6-13 14-21 24-21s18 8 24 21z" fill="#2f6b79" opacity="0.5" />
    </svg>
  );
}

/** Muschel als Stranddeko. */
export function Shell({ size = 26, className = '', style }: Props): JSX.Element {
  return (
    <svg viewBox="0 0 40 36" width={size} height={size * 0.9} className={className} style={style} aria-hidden="true">
      <path
        d="M20 4c9 0 16 7 16 16 0 6-3 12-6 14H10c-3-2-6-8-6-14C4 11 11 4 20 4z"
        fill="#ffd6e4"
        stroke="#b9698a"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d="M20 6v28M12 9l-2 24M28 9l2 24" stroke="#e8a6c0" strokeWidth="2.2" />
    </svg>
  );
}

/** Sandhügel für den Raubzug (unangetastet / ausgegraben). */
export function DigPile({ size = 90, className = '', style, dug = false }: Props & { dug?: boolean }): JSX.Element {
  return (
    <svg viewBox="0 0 100 70" width={size} height={size * 0.7} className={className} style={style} aria-hidden="true">
      {dug ? (
        <g>
          <ellipse cx="50" cy="46" rx="36" ry="18" fill="#c9a469" stroke="#8a6a33" strokeWidth="3" />
          <ellipse cx="50" cy="44" rx="24" ry="12" fill="#4a3218" stroke="#3b2412" strokeWidth="2.5" />
          <path d="M18 44c4-10 12-16 22-18" stroke="#e3c28c" strokeWidth="4" strokeLinecap="round" fill="none" />
        </g>
      ) : (
        <g>
          <ellipse cx="50" cy="52" rx="38" ry="14" fill="#c9a469" stroke="#8a6a33" strokeWidth="3" />
          <path
            d="M16 52c6-20 18-30 34-30s28 10 34 30z"
            fill="#e3c28c"
            stroke="#8a6a33"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M28 46c4-13 12-20 22-21-8 5-14 12-16 21z" fill="#f2dcb0" />
          <g transform="rotate(-20 66 26)">
            <rect x="63" y="0" width="7" height="30" rx="3.5" fill="#8a5c2c" stroke="#3b2412" strokeWidth="2.6" />
            <rect x="59" y="-4" width="15" height="7" rx="3.5" fill="#8a5c2c" stroke="#3b2412" strokeWidth="2.4" />
            <path d="M56 28h21l-3 16H59z" fill="#c2cad4" stroke="#4c545e" strokeWidth="2.6" strokeLinejoin="round" />
            <path d="M60 31h13" stroke="#e4e9ef" strokeWidth="2.4" />
          </g>
        </g>
      )}
    </svg>
  );
}
