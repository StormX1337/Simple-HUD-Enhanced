import type { DecoArt as DecoKind } from '../../types';

interface Props {
  art: DecoKind;
  size?: number;
  className?: string;
}

const OUTLINE = '#3b2412';

/** Dekorationen für die Insel – eigene SVGs im gleichen Cartoon-Stil. */
export function DecoArt({ art, size = 70, className = '' }: Props): JSX.Element {
  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      className={className}
      style={{ filter: 'drop-shadow(0 4px 2px rgba(0,0,0,0.3))' }}
      aria-hidden="true"
    >
      <ellipse cx="40" cy="72" rx="22" ry="6" fill="rgba(0,0,0,0.18)" />

      {art === 'palme' && (
        <g>
          <path d="M34 72c-2-16-2-28 2-38" stroke="#8a5c2c" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M50 72c2-12 2-22-1-30" stroke="#a97c46" strokeWidth="5" strokeLinecap="round" fill="none" />
          <g stroke="#2f4f2a" strokeWidth="2.2" strokeLinejoin="round">
            <path d="M36 34c-8-9-18-10-24-5 9-1 15 2 19 7z" fill="#4fae5c" />
            <path d="M36 34c8-9 18-10 24-5-9-1-15 2-19 7z" fill="#3f9a4f" />
            <path d="M36 33c-4-11-12-17-20-17 7 4 12 10 14 19z" fill="#5cc169" />
            <path d="M49 42c6-7 13-8 18-4-7 0-11 2-14 6z" fill="#4fae5c" />
          </g>
          <circle cx="33" cy="37" r="3" fill="#c8641f" stroke={OUTLINE} strokeWidth="1.6" />
        </g>
      )}

      {art === 'blumen' && (
        <g>
          <ellipse cx="40" cy="64" rx="24" ry="10" fill="#8a5c2c" stroke={OUTLINE} strokeWidth="2.4" />
          <ellipse cx="40" cy="62" rx="20" ry="8" fill="#5aa851" />
          {[
            [28, 56, '#ff7fa4'],
            [40, 52, '#ffd95e'],
            [52, 56, '#c792ea'],
          ].map(([x, y, color]) => (
            <g key={`${x}-${y}`}>
              <path d={`M${x} ${y}v10`} stroke="#2f7a35" strokeWidth="2.6" />
              {[0, 72, 144, 216, 288].map((angle) => (
                <ellipse
                  key={angle}
                  cx={Number(x) + 5 * Math.cos((angle * Math.PI) / 180)}
                  cy={Number(y) + 5 * Math.sin((angle * Math.PI) / 180)}
                  rx="3.4"
                  ry="3.4"
                  fill={String(color)}
                  stroke={OUTLINE}
                  strokeWidth="1.4"
                />
              ))}
              <circle cx={x} cy={y} r="3" fill="#fff6d0" stroke={OUTLINE} strokeWidth="1.4" />
            </g>
          ))}
        </g>
      )}

      {art === 'fackel' && (
        <g>
          {[26, 54].map((x) => (
            <g key={x}>
              <rect x={x - 3} y="34" width="6" height="36" rx="3" fill="#8a5c2c" stroke={OUTLINE} strokeWidth="2.2" />
              <rect x={x - 7} y="28" width="14" height="9" rx="3" fill="#6b4a22" stroke={OUTLINE} strokeWidth="2.2" />
              <path d={`M${x} 8c6 8 8 12 8 16a8 8 0 0 1-16 0c0-4 2-8 8-16z`} fill="#ff8a3c" stroke={OUTLINE} strokeWidth="2" />
              <path d={`M${x} 16c3 5 4 7 4 9a4 4 0 0 1-8 0c0-2 1-4 4-9z`} fill="#ffe066" />
            </g>
          ))}
        </g>
      )}

      {art === 'lagerfeuer' && (
        <g>
          <ellipse cx="40" cy="64" rx="22" ry="9" fill="#c9a469" stroke={OUTLINE} strokeWidth="2.4" />
          <g stroke={OUTLINE} strokeWidth="2.4" strokeLinejoin="round">
            <rect x="18" y="56" width="44" height="8" rx="4" fill="#a97c46" transform="rotate(-8 40 60)" />
            <rect x="18" y="58" width="44" height="8" rx="4" fill="#8a5c2c" transform="rotate(9 40 62)" />
          </g>
          <path d="M40 22c10 12 14 18 14 24a14 14 0 0 1-28 0c0-6 4-12 14-24z" fill="#ff8a3c" stroke={OUTLINE} strokeWidth="2.4" />
          <path d="M40 34c5 7 7 10 7 13a7 7 0 0 1-14 0c0-3 2-6 7-13z" fill="#ffe066" />
        </g>
      )}

      {art === 'zaun' && (
        <g stroke={OUTLINE} strokeWidth="2.4" strokeLinejoin="round">
          {[16, 32, 48, 64].map((x) => (
            <path key={x} d={`M${x} 68V36l5-6 5 6v32z`} fill="#c08b53" transform={`translate(${-2}, 0)`} />
          ))}
          <rect x="10" y="44" width="62" height="6" rx="3" fill="#a97c46" />
          <rect x="10" y="56" width="62" height="6" rx="3" fill="#a97c46" />
        </g>
      )}

      {art === 'brunnen' && (
        <g>
          <ellipse cx="40" cy="62" rx="22" ry="10" fill="#9aa2ad" stroke="#4c545e" strokeWidth="2.6" />
          <path d="M18 62V50h44v12" fill="#b9c2cc" stroke="#4c545e" strokeWidth="2.6" />
          <ellipse cx="40" cy="50" rx="22" ry="9" fill="#7cc6fe" stroke="#4c545e" strokeWidth="2.6" />
          <ellipse cx="40" cy="49" rx="15" ry="5.5" fill="#a9e1ff" />
          <rect x="22" y="16" width="5" height="34" fill="#8a5c2c" stroke={OUTLINE} strokeWidth="2" />
          <rect x="53" y="16" width="5" height="34" fill="#8a5c2c" stroke={OUTLINE} strokeWidth="2" />
          <path d="M14 18h52l-8-10H22z" fill="#e0533c" stroke={OUTLINE} strokeWidth="2.4" strokeLinejoin="round" />
          <rect x="34" y="22" width="12" height="9" rx="2" fill="#c9a469" stroke={OUTLINE} strokeWidth="2" />
        </g>
      )}

      {art === 'fahne' && (
        <g>
          <ellipse cx="40" cy="68" rx="16" ry="6" fill="#c9a469" stroke={OUTLINE} strokeWidth="2.2" />
          <rect x="37" y="10" width="6" height="58" rx="3" fill="#8a5c2c" stroke={OUTLINE} strokeWidth="2.4" />
          <path d="M43 12h26l-9 11 9 11H43z" fill="#e0533c" stroke={OUTLINE} strokeWidth="2.6" strokeLinejoin="round" />
          <g fill="#fff6e2">
            <ellipse cx="55" cy="24" rx="5" ry="4" />
            <ellipse cx="50" cy="18" rx="2.2" ry="2.6" />
            <ellipse cx="55" cy="16" rx="2.2" ry="2.6" />
            <ellipse cx="60" cy="18" rx="2.2" ry="2.6" />
          </g>
          <circle cx="40" cy="8" r="4" fill="#f8c73c" stroke={OUTLINE} strokeWidth="2" />
        </g>
      )}

      {art === 'statue' && (
        <g>
          <path d="M24 68l3-8h26l3 8z" fill="#9aa2ad" stroke="#4c545e" strokeWidth="2.4" strokeLinejoin="round" />
          <rect x="30" y="50" width="20" height="12" rx="3" fill="#b9c2cc" stroke="#4c545e" strokeWidth="2.4" />
          <g fill="#c9d0dc" stroke="#4c545e" strokeWidth="2.4">
            <path d="M32 50l3-14h10l3 14z" />
            <circle cx="40" cy="28" r="11" />
            <circle cx="31" cy="20" r="4.5" />
            <circle cx="49" cy="20" r="4.5" />
          </g>
          <path d="M33 27c3-3 6-3 8-1-2 3-4 4-7 4-1 0-2-2-1-3z" fill="#3a4457" />
          <path d="M47 27c-3-3-6-3-8-1 2 3 4 4 7 4 1 0 2-2 1-3z" fill="#3a4457" />
          <ellipse cx="40" cy="34" rx="6" ry="4.5" fill="#eef1f6" stroke="#4c545e" strokeWidth="1.8" />
        </g>
      )}
    </svg>
  );
}
