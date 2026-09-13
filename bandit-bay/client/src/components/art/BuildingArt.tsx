import type { BuildingKind } from '../../types';

interface Props {
  kind: BuildingKind;
  level: number;
  accent: string;
  size?: number;
  className?: string;
}

const OUTLINE = '#3b2412';
const STONE_OUTLINE = '#4a5260';

/**
 * Gebäude in Cartoon-Optik mit leichter 3D-Wirkung: hellere Frontwand,
 * dunklere Seitenwand, überstehendes Dach und Details, die mit jeder
 * Ausbaustufe dazukommen.
 */
export function BuildingArt({ kind, level, accent, size = 96, className = '' }: Props): JSX.Element {
  const scale = 0.68 + level * 0.068;
  const gold = level >= 5;

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      style={{ filter: 'drop-shadow(0 5px 3px rgba(0,0,0,0.32))' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`plot-${kind}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fd07a" />
          <stop offset="100%" stopColor="#5aa851" />
        </linearGradient>
      </defs>

      {/* Grundstück */}
      <ellipse cx="60" cy="104" rx="44" ry="11" fill="rgba(0,0,0,0.2)" />
      <path d="M16 100c0-9 20-15 44-15s44 6 44 15v5c0 9-20 15-44 15s-44-6-44-15z" fill="#a97c46" stroke={OUTLINE} strokeWidth="2.6" />
      <ellipse cx="60" cy="100" rx="44" ry="15" fill={`url(#plot-${kind})`} stroke={OUTLINE} strokeWidth="2.6" />
      <ellipse cx="60" cy="99" rx="34" ry="10" fill="#ffffff" opacity="0.12" />

      {level === 0 ? (
        <EmptyPlot />
      ) : (
        <g transform={`translate(60 98) scale(${scale}) translate(-60 -98)`}>
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

/* ---------------------------------------------------------------- */
/*  Bausteine                                                        */
/* ---------------------------------------------------------------- */

function EmptyPlot(): JSX.Element {
  return (
    <g>
      <ellipse cx="60" cy="99" rx="30" ry="9" fill="#c9a469" stroke="#8a6a33" strokeWidth="2" />
      <g stroke="#8a6a33" strokeWidth="2.4" strokeLinecap="round">
        <path d="M40 96h40M44 101h32" opacity="0.6" />
      </g>
      <rect x="57" y="62" width="6" height="30" rx="3" fill="#8a5c2c" stroke={OUTLINE} strokeWidth="2.2" />
      <g transform="rotate(-6 60 56)">
        <rect x="36" y="44" width="48" height="20" rx="4" fill="#f0d7a8" stroke={OUTLINE} strokeWidth="2.6" />
        <text x="60" y="58" fontSize="13" fontWeight="800" textAnchor="middle" fill="#6b4a22" fontFamily="sans-serif">
          FREI
        </text>
      </g>
      <ellipse cx="36" cy="94" rx="7" ry="4" fill="#6fbf5f" />
      <ellipse cx="86" cy="96" rx="6" ry="3.5" fill="#6fbf5f" />
    </g>
  );
}

/** Rechteckiger Baukörper mit Front- und Seitenwand. */
function Body({
  x,
  y,
  width,
  height,
  depth = 12,
  front,
  side,
  outline = OUTLINE,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  depth?: number;
  front: string;
  side: string;
  outline?: string;
}): JSX.Element {
  return (
    <g>
      <path
        d={`M${x + width} ${y}l${depth} ${-depth * 0.45}v${height}l${-depth} ${depth * 0.45}z`}
        fill={side}
        stroke={outline}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <rect x={x} y={y} width={width} height={height} rx="2" fill={front} stroke={outline} strokeWidth="2.8" />
    </g>
  );
}

/** Satteldach mit Überstand. */
function Roof({
  x,
  y,
  width,
  rise,
  depth = 12,
  color,
  gold,
}: {
  x: number;
  y: number;
  width: number;
  rise: number;
  depth?: number;
  color: string;
  gold: boolean;
}): JSX.Element {
  const top = y - rise;
  const fill = gold ? '#f8c73c' : color;
  return (
    <g>
      <path
        d={`M${x + width / 2} ${top}l${depth} ${-depth * 0.45}L${x + width + depth + 6} ${y - depth * 0.45}l${-depth} ${depth * 0.45}z`}
        fill={fill}
        stroke={OUTLINE}
        strokeWidth="2.6"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <path
        d={`M${x - 6} ${y}L${x + width / 2} ${top}L${x + width + 6} ${y}z`}
        fill={fill}
        stroke={OUTLINE}
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      <path d={`M${x - 2} ${y - 2}L${x + width / 2} ${top + 4}L${x + width / 2} ${y - 2}z`} fill="#ffffff" opacity="0.22" />
    </g>
  );
}

function Window({ x, y, size = 13, lit = false }: { x: number; y: number; size?: number; lit?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={size} height={size} rx="2.5" fill={lit ? '#ffd95e' : '#9fd0ee'} stroke={OUTLINE} strokeWidth="2.4" />
      <path d={`M${x + size / 2} ${y}v${size}M${x} ${y + size / 2}h${size}`} stroke={OUTLINE} strokeWidth="1.8" />
      {lit && <rect x={x + 2} y={y + 2} width={size / 2 - 2} height={size / 2 - 2} fill="#fff6d0" opacity="0.8" />}
    </g>
  );
}

function Door({ x, y, width = 16, height = 22 }: { x: number; y: number; width?: number; height?: number }) {
  return (
    <g>
      <path
        d={`M${x} ${y + height}v${-height + width / 2}a${width / 2} ${width / 2} 0 0 1 ${width} 0v${height - width / 2}z`}
        fill="#8a5c2c"
        stroke={OUTLINE}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <circle cx={x + width - 4} cy={y + height / 2 + 3} r="1.8" fill="#f8c73c" />
      <rect x={x - 3} y={y + height - 3} width={width + 6} height="4" rx="2" fill="#c9a469" stroke={OUTLINE} strokeWidth="2" />
    </g>
  );
}

function Flag({ x, y, gold, accent }: { x: number; y: number; gold: boolean; accent: string }) {
  return (
    <g>
      <rect x={x} y={y} width="3" height="20" rx="1.5" fill="#6b4a22" stroke={OUTLINE} strokeWidth="1.6" />
      <path
        d={`M${x + 3} ${y + 1}h15l-5 6 5 6H${x + 3}z`}
        fill={gold ? '#f8c73c' : accent}
        stroke={OUTLINE}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </g>
  );
}

function Barrel({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width="13" height="16" rx="4" fill="#c08b53" stroke={OUTLINE} strokeWidth="2.2" />
      <path d={`M${x} ${y + 5}h13M${x} ${y + 11}h13`} stroke="#7a441c" strokeWidth="2" />
    </g>
  );
}

function Crate({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width="15" height="13" rx="2" fill="#d9a86a" stroke={OUTLINE} strokeWidth="2.2" />
      <path d={`M${x} ${y}l15 13M${x + 15} ${y}l-15 13`} stroke="#a97c46" strokeWidth="2" />
    </g>
  );
}

function Plant({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y + 8} width="12" height="9" rx="2" fill="#c08b53" stroke={OUTLINE} strokeWidth="2" />
      <circle cx={x + 6} cy={y + 5} r="7" fill="#5aa851" stroke={OUTLINE} strokeWidth="2" />
      <circle cx={x + 3} cy={y + 3} r="2" fill="#ff7fa4" />
    </g>
  );
}

/* ---------------------------------------------------------------- */
/*  Gebäudetypen                                                     */
/* ---------------------------------------------------------------- */

function Hut({ level, accent, gold }: PartProps) {
  return (
    <g>
      <Body x={26} y={62} width={56} height={34} front="#f6e0b4" side="#d9bd8a" />
      <path d="M26 78h56" stroke="#d9bd8a" strokeWidth="2" />
      <Roof x={26} y={62} width={56} rise={26} color={accent} gold={gold} />
      <Door x={46} y={74} />
      {level >= 2 && <Window x={30} y={66} lit={level >= 3} />}
      {level >= 3 && <Window x={68} y={66} lit />}
      {level >= 2 && (
        <g>
          <rect x="66" y="34" width="11" height="18" rx="2" fill="#b5834a" stroke={OUTLINE} strokeWidth="2.4" />
          <rect x="64" y="31" width="15" height="6" rx="2" fill="#8a5c2c" stroke={OUTLINE} strokeWidth="2.2" />
        </g>
      )}
      {level >= 3 && (
        <g fill="#e9eef5" opacity="0.9">
          <circle cx="71" cy="26" r="5" />
          <circle cx="78" cy="19" r="3.4" />
        </g>
      )}
      {level >= 4 && <Plant x={18} y={80} />}
      {level >= 4 && <Barrel x={88} y={80} />}
      {level >= 4 && <Flag x={58} y={18} gold={gold} accent={accent} />}
      {gold && <path d="M20 62h68v5H20z" fill="#f8c73c" stroke={OUTLINE} strokeWidth="2" />}
    </g>
  );
}

function Dock({ level, accent, gold }: PartProps) {
  return (
    <g>
      {/* Wasser nur im vorderen Bereich des Grundstücks */}
      <clipPath id="dock-water">
        <rect x="12" y="92" width="96" height="24" />
      </clipPath>
      <g clipPath="url(#dock-water)">
        <ellipse cx="60" cy="97" rx="42" ry="14" fill="#4aa8dd" />
        <path d="M24 98c8-3 14 3 22 0M66 102c8-3 14 3 22 0" stroke="#ffffff" strokeWidth="2.4" opacity="0.6" fill="none" />
      </g>
      {/* Steg */}
      <path d="M14 80h92v10H14z" fill="#c9a469" stroke={OUTLINE} strokeWidth="2.6" />
      <path d="M26 80v10M44 80v10M62 80v10M80 80v10" stroke="#a97c46" strokeWidth="2.2" />
      <rect x="22" y="88" width="7" height="14" rx="2" fill="#8a5c2c" stroke={OUTLINE} strokeWidth="2.2" />
      <rect x="86" y="88" width="7" height="14" rx="2" fill="#8a5c2c" stroke={OUTLINE} strokeWidth="2.2" />
      {/* Hütte auf dem Steg */}
      <Body x={58} y={54} width={38} height={26} depth={10} front="#f6e0b4" side="#d9bd8a" />
      <Roof x={58} y={54} width={38} rise={18} depth={10} color={accent} gold={gold} />
      <Door x={70} y={62} width={13} height={18} />
      {level >= 3 && <Window x={61} y={58} size={11} lit />}
      {level >= 2 && (
        <g>
          {/* Boot */}
          <path d="M14 74h34l-6 12H20z" fill="#d9713a" stroke={OUTLINE} strokeWidth="2.6" strokeLinejoin="round" />
          <rect x="28" y="44" width="4" height="30" fill="#7a441c" stroke={OUTLINE} strokeWidth="1.8" />
          <path d="M32 46h18l-18 18z" fill="#fff6e2" stroke={OUTLINE} strokeWidth="2.4" strokeLinejoin="round" />
        </g>
      )}
      {level >= 4 && <Crate x={46} y={66} />}
      {level >= 4 && (
        <g>
          <rect x="100" y="58" width="4" height="22" rx="2" fill="#6b4a22" stroke={OUTLINE} strokeWidth="1.8" />
          <circle cx="102" cy="54" r="7" fill="#ffd95e" stroke={OUTLINE} strokeWidth="2.2" />
          <circle cx="102" cy="54" r="12" fill="#ffd95e" opacity="0.25" />
        </g>
      )}
      {gold && <path d="M14 78h92v4H14z" fill="#f8c73c" />}
    </g>
  );
}

function Mill({ level, accent, gold }: PartProps) {
  return (
    <g>
      <path d="M40 96l6-44h28l6 44z" fill="#f6e0b4" stroke={OUTLINE} strokeWidth="2.8" strokeLinejoin="round" />
      <path d="M74 52l10-4 7 48-11 0z" fill="#d9bd8a" stroke={OUTLINE} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M43 74h34M42 86h36" stroke="#d9bd8a" strokeWidth="2.2" />
      <path d="M36 52h48L60 30z" fill={gold ? '#f8c73c' : accent} stroke={OUTLINE} strokeWidth="2.8" strokeLinejoin="round" />
      <path d="M42 50L60 34v16z" fill="#ffffff" opacity="0.25" />
      <Door x={52} y={74} width={16} height={22} />
      {level >= 3 && <Window x={46} y={58} size={11} lit />}
      {level >= 3 && <Window x={63} y={58} size={11} lit={level >= 4} />}
      <g className="animate-[spin_11s_linear_infinite]" style={{ transformOrigin: '60px 46px' }}>
        <g stroke={OUTLINE} strokeWidth="2.4" strokeLinejoin="round">
          <rect x="56" y="14" width="8" height="32" rx="3" fill="#e0c08a" />
          <rect x="56" y="46" width="8" height="32" rx="3" fill="#e0c08a" />
          <rect x="24" y="42" width="36" height="8" rx="3" fill="#d9bd8a" />
          <rect x="60" y="42" width="36" height="8" rx="3" fill="#d9bd8a" />
        </g>
        <circle cx="60" cy="46" r="6" fill="#8a5c2c" stroke={OUTLINE} strokeWidth="2.4" />
      </g>
      {level >= 4 && <Barrel x={22} y={80} />}
      {level >= 4 && <Crate x={92} y={82} />}
      {gold && <ellipse cx="60" cy="46" rx="9" ry="9" fill="#f8c73c" stroke={OUTLINE} strokeWidth="2" />}
    </g>
  );
}

function Tower({ level, accent, gold }: PartProps) {
  return (
    <g>
      <Body x={40} y={44} width={40} height={52} depth={11} front="#dfe4ec" side="#bcc4d1" outline={STONE_OUTLINE} />
      <g stroke="#b3bcca" strokeWidth="2.2">
        <path d="M40 60h40M40 76h40M54 44v52M66 44v52" />
      </g>
      <path
        d="M36 44h48v-8h-8v-8h-8v8h-8v-8h-8v8h-8v8z"
        fill="#cfd6e2"
        stroke={STONE_OUTLINE}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <Door x={52} y={74} width={16} height={22} />
      <rect x="52" y="52" width="16" height="14" rx="7" fill={level >= 2 ? '#ffd95e' : '#2f4468'} stroke={STONE_OUTLINE} strokeWidth="2.4" />
      {level >= 3 && (
        <path d="M32 36l28-20 28 20z" fill={gold ? '#f8c73c' : accent} stroke={OUTLINE} strokeWidth="2.8" strokeLinejoin="round" />
      )}
      {level >= 4 && <Flag x={58} y={-2} gold={gold} accent={accent} />}
      {level >= 4 && <Plant x={22} y={80} />}
      {level >= 4 && <Plant x={90} y={80} />}
      {gold && <rect x="40" y="66" width="40" height="5" fill="#f8c73c" stroke={OUTLINE} strokeWidth="1.8" />}
    </g>
  );
}

function Statue({ level, accent, gold }: PartProps) {
  const body = gold ? '#f8c73c' : '#c9d0dc';
  return (
    <g>
      <path d="M32 96l4-12h48l4 12z" fill="#b9c0cc" stroke={STONE_OUTLINE} strokeWidth="2.6" strokeLinejoin="round" />
      <rect x="40" y="72" width="40" height="14" rx="3" fill="#dfe4ec" stroke={STONE_OUTLINE} strokeWidth="2.6" />
      <rect x="46" y="76" width="28" height="7" rx="2" fill={gold ? '#ffe9a0' : '#aab2bd'} stroke={STONE_OUTLINE} strokeWidth="2" />
      <g fill={body} stroke={STONE_OUTLINE} strokeWidth="2.6">
        <path d="M44 72l4-20h24l4 20z" />
        <circle cx="60" cy="40" r="15" />
        <circle cx="47" cy="28" r="6.5" />
        <circle cx="73" cy="28" r="6.5" />
      </g>
      <path d="M48 39c4-5 9-5 12-1-2 5-6 7-10 7-2 0-3-3-2-6z" fill="#3a4457" />
      <path d="M72 39c-4-5-9-5-12-1 2 5 6 7 10 7 2 0 3-3 2-6z" fill="#3a4457" />
      <ellipse cx="60" cy="48" rx="8" ry="6" fill="#f2f4f9" stroke={STONE_OUTLINE} strokeWidth="1.8" />
      {level >= 3 && (
        <path d="M74 58l16-10 5 7-16 10z" fill={accent} stroke={OUTLINE} strokeWidth="2.4" strokeLinejoin="round" />
      )}
      {level >= 2 && <Plant x={22} y={78} />}
      {level >= 4 && <Plant x={90} y={78} />}
      {level >= 4 && (
        <g stroke={OUTLINE} strokeWidth="2">
          <circle cx="36" cy="66" r="5" fill="#ffd95e" />
          <circle cx="84" cy="66" r="5" fill="#ffd95e" />
        </g>
      )}
    </g>
  );
}

function Market({ level, accent, gold }: PartProps) {
  return (
    <g>
      <Body x={30} y={62} width={52} height={34} front="#f6e0b4" side="#d9bd8a" />
      <path d="M30 80h52" stroke="#d9bd8a" strokeWidth="2.2" />
      {/* Markise */}
      <path d="M22 62l8-18h60l8 18z" fill="#fff6e2" stroke={OUTLINE} strokeWidth="2.8" strokeLinejoin="round" />
      <path
        d="M30 44h11l-4 18H26zM52 44h11l-4 18H48zM74 44h11l7 18H70z"
        fill={gold ? '#f8c73c' : accent}
      />
      <path d="M22 62h76" stroke={OUTLINE} strokeWidth="2.6" />
      {/* Auslage */}
      <rect x="34" y="70" width="22" height="16" rx="2" fill="#c9a469" stroke={OUTLINE} strokeWidth="2.4" />
      <rect x="60" y="70" width="20" height="16" rx="2" fill="#c9a469" stroke={OUTLINE} strokeWidth="2.4" />
      {level >= 2 && (
        <g stroke={OUTLINE} strokeWidth="2">
          <circle cx="42" cy="76" r="4.5" fill="#ff7f56" />
          <circle cx="50" cy="76" r="4.5" fill="#ffd95e" />
          <circle cx="68" cy="76" r="4.5" fill="#8ee06a" />
        </g>
      )}
      {level >= 3 && (
        <g>
          <rect x="86" y="74" width="16" height="22" rx="3" fill="#d9a86a" stroke={OUTLINE} strokeWidth="2.4" />
          <path d="M86 82h16" stroke="#a97c46" strokeWidth="2" />
        </g>
      )}
      {level >= 3 && <Crate x={16} y={82} />}
      {level >= 4 && <Flag x={96} y={26} gold={gold} accent={accent} />}
      {level >= 4 && (
        <g>
          <rect x="40" y="30" width="40" height="14" rx="4" fill="#8a5c2c" stroke={OUTLINE} strokeWidth="2.4" />
          <text x="60" y="41" fontSize="10" fontWeight="800" textAnchor="middle" fill="#ffe9a0" fontFamily="sans-serif">
            MARKT
          </text>
        </g>
      )}
    </g>
  );
}

function Forge({ level, accent, gold }: PartProps) {
  return (
    <g>
      <Body x={28} y={60} width={54} height={36} front="#c9cfd9" side="#a8b0bd" outline={STONE_OUTLINE} />
      <g stroke="#a8b0bd" strokeWidth="2.2">
        <path d="M28 72h54M28 84h54M46 60v36M64 60v36" />
      </g>
      <Roof x={28} y={60} width={54} rise={22} color={accent} gold={gold} />
      <rect x="70" y="26" width="14" height="22" rx="3" fill="#8a5c2c" stroke={OUTLINE} strokeWidth="2.6" />
      <rect x="68" y="22" width="18" height="7" rx="2" fill="#6b4a22" stroke={OUTLINE} strokeWidth="2.2" />
      {/* Esse */}
      <path d="M46 72h20v24H46z" fill="#3a3129" stroke={OUTLINE} strokeWidth="2.6" />
      <path d="M50 94c0-9 6-11 6-17 5 4 9 8 9 12 0 3-2 5-4 5z" fill="#ff8a3c" />
      <path d="M54 94c0-5 3-7 3-10 2 2 4 4 4 7 0 2-1 3-2 3z" fill="#ffe066" />
      {level >= 2 && <Window x={31} y={64} size={11} lit />}
      {level >= 3 && (
        <g fill="#e9eef5" opacity="0.85">
          <circle cx="78" cy="16" r="6" />
          <circle cx="86" cy="8" r="4" />
        </g>
      )}
      {level >= 3 && (
        <g>
          {/* Amboss */}
          <path d="M88 80h16l-3 6h-4v6h-2v-6h-4z" fill="#5b6472" stroke={STONE_OUTLINE} strokeWidth="2.2" strokeLinejoin="round" />
        </g>
      )}
      {level >= 4 && <Barrel x={16} y={80} />}
      {level >= 4 && (
        <g stroke={OUTLINE} strokeWidth="2">
          <rect x="20" y="62" width="14" height="10" rx="2" fill="#f8c73c" />
        </g>
      )}
    </g>
  );
}

function Lighthouse({ level, accent, gold }: PartProps) {
  return (
    <g>
      {level >= 3 && (
        <g>
          <circle cx="60" cy="30" r="20" fill="#ffe066" opacity="0.35" />
          <circle cx="60" cy="30" r="13" fill="#ffe066" opacity="0.45" />
        </g>
      )}
      <path d="M44 96l5-52h22l5 52z" fill="#fff6e2" stroke={OUTLINE} strokeWidth="2.8" strokeLinejoin="round" />
      <path d="M71 44l9-3 8 55H76z" fill="#e6d8bb" stroke={OUTLINE} strokeWidth="2.4" strokeLinejoin="round" opacity="0.9" />
      <path d="M47.2 70h25.6l1 12H46.2z" fill={gold ? '#f8c73c' : '#e0533c'} />
      <path d="M48.5 54h22l.8 9H47.7z" fill={gold ? '#f8c73c' : '#e0533c'} />
      <rect x="40" y="38" width="40" height="7" rx="3" fill="#c9cfd9" stroke={OUTLINE} strokeWidth="2.4" />
      <rect x="46" y="22" width="28" height="17" rx="3" fill="#2f4468" stroke={OUTLINE} strokeWidth="2.6" />
      <circle cx="60" cy="30" r="7" fill="#ffd95e" stroke={OUTLINE} strokeWidth="2.2" />
      <path d="M46 20h28l-14-12z" fill={accent} stroke={OUTLINE} strokeWidth="2.6" strokeLinejoin="round" />
      <Door x={52} y={76} width={16} height={20} />
      {level >= 2 && (
        <g stroke={STONE_OUTLINE} strokeWidth="2.4">
          <ellipse cx="30" cy="92" rx="13" ry="7" fill="#a8b0bd" />
          <ellipse cx="92" cy="94" rx="10" ry="6" fill="#a8b0bd" />
        </g>
      )}
      {level >= 4 && <Plant x={78} y={80} />}
      {level >= 4 && <Crate x={16} y={82} />}
    </g>
  );
}
