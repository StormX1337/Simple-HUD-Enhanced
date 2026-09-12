import type { BuildingKind } from '../../types';

interface Props {
  kind: BuildingKind;
  level: number;
  accent: string;
  size?: number;
  className?: string;
}

const OUTLINE = '#3b2412';
const STONE_OUTLINE = '#4c545e';

/**
 * Gebäude im Cartoon-Stil: dicke Konturen, Verläufe, Glanzlichter.
 * Jede Ausbaustufe fügt sichtbar Details hinzu (Fenster, Fahnen, Gold).
 */
export function BuildingArt({ kind, level, accent, size = 96, className = '' }: Props): JSX.Element {
  const scale = 0.66 + level * 0.072;
  const gold = level >= 5;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={{ filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.3))' }}
      aria-hidden="true"
    >
      <ellipse cx="50" cy="90" rx="33" ry="7.5" fill="rgba(0,0,0,0.22)" />
      {level === 0 ? <EmptyPlot /> : (
        <g transform={`translate(50 86) scale(${scale}) translate(-50 -86)`}>
          <ellipse cx="50" cy="86" rx="34" ry="9" fill="#d8b880" stroke="#a8874f" strokeWidth="2" />
          {kind === 'hut' && <Hut level={level} accent={accent} gold={gold} />}
          {kind === 'dock' && <Dock level={level} accent={accent} gold={gold} />}
          {kind === 'mill' && <Mill level={level} accent={accent} gold={gold} />}
          {kind === 'tower' && <Tower level={level} accent={accent} gold={gold} />}
          {kind === 'statue' && <Statue level={level} accent={accent} gold={gold} />}
          {kind === 'market' && <Market level={level} accent={accent} gold={gold} />}
          {kind === 'forge' && <Forge level={level} accent={accent} gold={gold} />}
          {kind === 'lighthouse' && <Lighthouse level={level} accent={accent} gold={gold} />}
        </g>
      )}
    </svg>
  );
}

interface PartProps {
  level: number;
  accent: string;
  gold: boolean;
}

function EmptyPlot(): JSX.Element {
  return (
    <g>
      <ellipse cx="50" cy="84" rx="32" ry="10" fill="#e2c48d" stroke="#b1904f" strokeWidth="2.4" />
      <ellipse cx="50" cy="82" rx="24" ry="7" fill="#d3b277" />
      <rect
        x="30"
        y="64"
        width="40"
        height="18"
        rx="4"
        fill="none"
        stroke="#8a6a33"
        strokeWidth="2.6"
        strokeDasharray="6 5"
      />
      <rect x="47" y="46" width="5" height="20" rx="2" fill="#8a5c2c" stroke={OUTLINE} strokeWidth="2" />
      <rect x="30" y="34" width="40" height="16" rx="4" fill="#e6cfa4" stroke={OUTLINE} strokeWidth="2.4" />
      <text x="50" y="46" fontSize="12" fontWeight="800" textAnchor="middle" fill="#6b4a22" fontFamily="sans-serif">
        FREI
      </text>
    </g>
  );
}

function Flag({ x, y, gold, accent }: { x: number; y: number; gold: boolean; accent: string }) {
  return (
    <g>
      <rect x={x} y={y} width="2.6" height="18" rx="1.3" fill="#6b4a22" stroke={OUTLINE} strokeWidth="1.4" />
      <path
        d={`M${x + 2.6} ${y + 1}h13l-4.5 5.5 4.5 5.5H${x + 2.6}z`}
        fill={gold ? '#f8c73c' : accent}
        stroke={OUTLINE}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </g>
  );
}

function Window({ x, y, lit }: { x: number; y: number; lit: boolean }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width="11"
        height="11"
        rx="2"
        fill={lit ? '#ffd95e' : '#79b6e0'}
        stroke={OUTLINE}
        strokeWidth="2"
      />
      <path d={`M${x + 5.5} ${y}v11M${x} ${y + 5.5}h11`} stroke={OUTLINE} strokeWidth="1.4" />
    </g>
  );
}

function Hut({ level, accent, gold }: PartProps) {
  return (
    <g>
      <rect x="27" y="54" width="46" height="32" rx="3" fill="#f0d7a8" stroke={OUTLINE} strokeWidth="2.6" />
      <path d="M27 66h46M27 76h46" stroke="#d8b880" strokeWidth="2" />
      <path
        d="M20 58L50 33l30 25z"
        fill={gold ? '#f8c73c' : accent}
        stroke={OUTLINE}
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      <path d="M26 56L50 37l24 19z" fill="rgba(255,255,255,0.28)" />
      <rect x="42" y="66" width="16" height="20" rx="2" fill="#8a5c2c" stroke={OUTLINE} strokeWidth="2.4" />
      <circle cx="54" cy="76" r="1.8" fill="#f8c73c" />
      {level >= 2 && <Window x={30} y={60} lit={level >= 3} />}
      {level >= 3 && <Window x={59} y={60} lit />}
      {level >= 3 && (
        <g>
          <rect x="62" y="36" width="9" height="16" rx="2" fill="#b5834a" stroke={OUTLINE} strokeWidth="2.2" />
          <circle cx="66" cy="32" r="4" fill="#e9eef5" opacity="0.85" />
        </g>
      )}
      {level >= 4 && <Flag x={48} y={16} gold={gold} accent={accent} />}
      {gold && <path d="M20 58h60v4H20z" fill="#f8c73c" stroke={OUTLINE} strokeWidth="1.6" />}
    </g>
  );
}

function Dock({ level, accent, gold }: PartProps) {
  return (
    <g>
      <path d="M14 66h72v9H14z" fill="#c08b53" stroke={OUTLINE} strokeWidth="2.6" />
      <path d="M22 66v9M36 66v9M50 66v9M64 66v9M78 66v9" stroke="#8a5c2c" strokeWidth="2" />
      <rect x="20" y="75" width="6" height="14" rx="2" fill="#8a5c2c" stroke={OUTLINE} strokeWidth="2.2" />
      <rect x="48" y="75" width="6" height="14" rx="2" fill="#8a5c2c" stroke={OUTLINE} strokeWidth="2.2" />
      <rect x="72" y="75" width="6" height="14" rx="2" fill="#8a5c2c" stroke={OUTLINE} strokeWidth="2.2" />
      {level >= 2 && (
        <g>
          <path d="M24 56h34l-5 10H29z" fill="#d9713a" stroke={OUTLINE} strokeWidth="2.4" strokeLinejoin="round" />
          <rect x="38" y="32" width="3" height="24" fill="#7a441c" stroke={OUTLINE} strokeWidth="1.6" />
          <path d="M41 33h16l-16 15z" fill="#fff6e2" stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round" />
        </g>
      )}
      {level >= 3 && (
        <g>
          <rect x="60" y="48" width="22" height="18" rx="3" fill="#f0d7a8" stroke={OUTLINE} strokeWidth="2.4" />
          <path d="M57 48l14-10 14 10z" fill={gold ? '#f8c73c' : accent} stroke={OUTLINE} strokeWidth="2.4" strokeLinejoin="round" />
          <Window x={65} y={53} lit={level >= 4} />
        </g>
      )}
      {level >= 4 && (
        <g>
          <rect x="14" y="46" width="4" height="20" rx="2" fill="#6b4a22" stroke={OUTLINE} strokeWidth="1.8" />
          <circle cx="16" cy="42" r="6" fill="#ffd95e" stroke={OUTLINE} strokeWidth="2" />
          <circle cx="16" cy="42" r="9" fill="#ffd95e" opacity="0.3" />
        </g>
      )}
      {gold && <path d="M14 64h72v3H14z" fill="#f8c73c" />}
    </g>
  );
}

function Mill({ level, accent, gold }: PartProps) {
  return (
    <g>
      <path d="M34 86l5-38h22l5 38z" fill="#f0d7a8" stroke={OUTLINE} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M36 70h28M35 78h30" stroke="#d8b880" strokeWidth="2" />
      <path
        d="M35 48h30L50 30z"
        fill={gold ? '#f8c73c' : accent}
        stroke={OUTLINE}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <rect x="43" y="70" width="14" height="16" rx="2" fill="#8a5c2c" stroke={OUTLINE} strokeWidth="2.4" />
      {level >= 3 && <Window x={38} y={56} lit />}
      <g style={{ transformOrigin: '50px 50px' }} className="animate-[spin_10s_linear_infinite]">
        <g stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round">
          <rect x="47" y="22" width="6" height="28" rx="2" fill="#e0c08a" />
          <rect x="47" y="50" width="6" height="28" rx="2" fill="#e0c08a" />
          <rect x="22" y="47" width="28" height="6" rx="2" fill="#d8b880" />
          <rect x="50" y="47" width="28" height="6" rx="2" fill="#d8b880" />
        </g>
        <circle cx="50" cy="50" r="5" fill="#8a5c2c" stroke={OUTLINE} strokeWidth="2.2" />
      </g>
      {level >= 4 && <Flag x={48} y={12} gold={gold} accent={accent} />}
    </g>
  );
}

function Tower({ level, accent, gold }: PartProps) {
  return (
    <g>
      <rect x="34" y="40" width="32" height="46" rx="3" fill="#d8dde5" stroke={STONE_OUTLINE} strokeWidth="2.6" />
      <path d="M34 54h32M34 68h32M42 40v46M58 40v46" stroke="#b6bcc7" strokeWidth="2" />
      <path
        d="M31 40h38v-6h-6v-6h-6v6h-7v-6h-6v6h-7v6h-6z"
        fill="#c2c9d2"
        stroke={STONE_OUTLINE}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <rect x="43" y="68" width="14" height="18" rx="6" fill="#6b4a22" stroke={OUTLINE} strokeWidth="2.4" />
      <rect x="44" y="46" width="12" height="14" rx="5" fill={level >= 2 ? '#ffd95e' : '#33507a'} stroke={STONE_OUTLINE} strokeWidth="2.2" />
      {level >= 3 && (
        <path
          d="M28 34l22-18 22 18z"
          fill={gold ? '#f8c73c' : accent}
          stroke={OUTLINE}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
      )}
      {level >= 4 && <Flag x={48} y={2} gold={gold} accent={accent} />}
      {gold && <rect x="34" y="60" width="32" height="4" fill="#f8c73c" stroke={OUTLINE} strokeWidth="1.4" />}
    </g>
  );
}

function Statue({ level, accent, gold }: PartProps) {
  const body = gold ? '#f8c73c' : '#c2c9d2';
  return (
    <g>
      <rect x="30" y="74" width="40" height="12" rx="3" fill="#c9cfd8" stroke={STONE_OUTLINE} strokeWidth="2.6" />
      <rect x="35" y="64" width="30" height="11" rx="3" fill="#dde2e9" stroke={STONE_OUTLINE} strokeWidth="2.4" />
      <rect x="40" y="76" width="20" height="7" rx="2" fill={gold ? '#ffe9a0' : '#aab2bd'} stroke={STONE_OUTLINE} strokeWidth="1.8" />
      <g fill={body} stroke={STONE_OUTLINE} strokeWidth="2.4">
        <path d="M38 64l3-16h18l3 16z" />
        <circle cx="50" cy="38" r="13" />
        <circle cx="39" cy="28" r="5.5" />
        <circle cx="61" cy="28" r="5.5" />
      </g>
      <path d="M40 37c3-4 8-4 10-1-2 4-5 6-9 6-2 0-2-3-1-5z" fill="#3a4457" />
      <path d="M60 37c-3-4-8-4-10-1 2 4 5 6 9 6 2 0 2-3 1-5z" fill="#3a4457" />
      <ellipse cx="50" cy="45" rx="7" ry="5" fill="#f2f4f9" stroke={STONE_OUTLINE} strokeWidth="1.6" />
      {level >= 3 && (
        <path d="M62 52l14-9 4 6-14 9z" fill={accent} stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round" />
      )}
      {level >= 4 && (
        <g stroke={OUTLINE} strokeWidth="1.8">
          <circle cx="28" cy="60" r="5" fill="#ffd95e" />
          <circle cx="72" cy="60" r="5" fill="#ffd95e" />
        </g>
      )}
    </g>
  );
}

function Market({ level, accent, gold }: PartProps) {
  return (
    <g>
      <rect x="24" y="58" width="52" height="28" rx="3" fill="#f0d7a8" stroke={OUTLINE} strokeWidth="2.6" />
      <path d="M24 72h52" stroke="#d8b880" strokeWidth="2" />
      <path d="M18 58l7-16h50l7 16z" fill="#fff6e2" stroke={OUTLINE} strokeWidth="2.6" strokeLinejoin="round" />
      <path
        d="M25 42h10l-4 16H18zM45 42h10l-4 16H41zM65 42h10l7 16H61z"
        fill={gold ? '#f8c73c' : accent}
        opacity="0.95"
      />
      <path d="M18 58h64" stroke={OUTLINE} strokeWidth="2.4" />
      <rect x="30" y="64" width="16" height="14" rx="2" fill="#c08b53" stroke={OUTLINE} strokeWidth="2.2" />
      <rect x="54" y="64" width="16" height="14" rx="2" fill="#c08b53" stroke={OUTLINE} strokeWidth="2.2" />
      {level >= 2 && (
        <g stroke={OUTLINE} strokeWidth="1.8">
          <circle cx="38" cy="70" r="4" fill="#ff7f56" />
          <circle cx="62" cy="70" r="4" fill="#8ee06a" />
        </g>
      )}
      {level >= 3 && (
        <g>
          <circle cx="34" cy="52" r="3.4" fill="#ffd95e" stroke={OUTLINE} strokeWidth="1.6" />
          <circle cx="66" cy="52" r="3.4" fill="#ffd95e" stroke={OUTLINE} strokeWidth="1.6" />
        </g>
      )}
      {level >= 4 && <Flag x={76} y={24} gold={gold} accent={accent} />}
    </g>
  );
}

function Forge({ level, accent, gold }: PartProps) {
  return (
    <g>
      <rect x="26" y="54" width="48" height="32" rx="3" fill="#b9bfc8" stroke={STONE_OUTLINE} strokeWidth="2.6" />
      <path d="M26 66h48M38 54v32M58 54v32" stroke="#9aa2ad" strokeWidth="2" />
      <path
        d="M20 56L50 34l30 22z"
        fill={gold ? '#f8c73c' : accent}
        stroke={OUTLINE}
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      <rect x="62" y="24" width="12" height="18" rx="2" fill="#8a5c2c" stroke={OUTLINE} strokeWidth="2.4" />
      <path d="M42 66h16v20H42z" fill="#3a3129" stroke={OUTLINE} strokeWidth="2.4" />
      <path d="M45 84c0-8 5-9 5-15 4 4 8 7 8 11 0 3-2 4-3 4z" fill="#ff8a3c" />
      <path d="M48 84c0-5 3-6 3-9 2 2 4 4 4 6 0 2-1 3-2 3z" fill="#ffd95e" />
      {level >= 3 && (
        <g fill="#e9eef5" opacity="0.85">
          <circle cx="68" cy="18" r="5" />
          <circle cx="74" cy="11" r="3.4" />
        </g>
      )}
      {level >= 4 && (
        <g stroke={OUTLINE} strokeWidth="2">
          <rect x="28" y="62" width="12" height="9" rx="2" fill="#f8c73c" />
          <rect x="28" y="73" width="12" height="9" rx="2" fill="#d9a015" />
        </g>
      )}
    </g>
  );
}

function Lighthouse({ level, accent, gold }: PartProps) {
  return (
    <g>
      <path d="M36 86l4-44h20l4 44z" fill="#fff6e2" stroke={OUTLINE} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M38.4 66h23.2l1 10H37.4z" fill={gold ? '#f8c73c' : '#e0533c'} />
      <path d="M39.6 52h20.8l.8 8H38.8z" fill={gold ? '#f8c73c' : '#e0533c'} />
      <rect x="34" y="38" width="32" height="6" rx="2" fill="#c9cfd8" stroke={OUTLINE} strokeWidth="2.2" />
      <rect x="38" y="26" width="24" height="13" rx="3" fill="#2f4468" stroke={OUTLINE} strokeWidth="2.4" />
      <circle cx="50" cy="32" r="5.5" fill="#ffd95e" stroke={OUTLINE} strokeWidth="1.8" />
      <path d="M40 24h20l-10-10z" fill={accent} stroke={OUTLINE} strokeWidth="2.4" strokeLinejoin="round" />
      <rect x="42" y="72" width="14" height="14" rx="2" fill="#8a5c2c" stroke={OUTLINE} strokeWidth="2.4" />
      {level >= 3 && (
        <g opacity="0.5">
          <path d="M62 32l30-10v22z" fill="#ffe9a0" />
          <path d="M38 32L8 22v22z" fill="#ffe9a0" />
        </g>
      )}
      {level >= 4 && (
        <g stroke={STONE_OUTLINE} strokeWidth="2.2">
          <ellipse cx="28" cy="84" rx="11" ry="6" fill="#9aa2ad" />
          <ellipse cx="72" cy="84" rx="9" ry="5" fill="#9aa2ad" />
        </g>
      )}
    </g>
  );
}
