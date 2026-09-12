import type { BuildingKind } from '../../types';

interface Props {
  kind: BuildingKind;
  level: number;
  accent: string;
  size?: number;
  className?: string;
}

/**
 * Gebaeude werden vollstaendig als SVG gezeichnet und wachsen mit jedem
 * Ausbaulevel sichtbar mit (Stufe 0 = leeres Baugrundstueck).
 */
export function BuildingArt({ kind, level, accent, size = 96, className = '' }: Props): JSX.Element {
  const scale = 0.62 + level * 0.076;
  const gold = level >= 5;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      <ellipse cx="50" cy="88" rx="34" ry="8" fill="rgba(0,0,0,0.18)" />
      {level === 0 ? (
        <g>
          <ellipse cx="50" cy="84" rx="30" ry="9" fill="#c8b183" />
          <rect
            x="26"
            y="58"
            width="48"
            height="26"
            rx="4"
            fill="none"
            stroke="#7b6437"
            strokeWidth="3"
            strokeDasharray="6 5"
          />
          <rect x="46" y="42" width="4" height="18" fill="#8b5a2b" />
          <rect x="36" y="34" width="26" height="12" rx="2" fill="#c08b53" />
          <text x="49" y="43" fontSize="8" textAnchor="middle" fill="#4a3312" fontFamily="sans-serif">
            frei
          </text>
        </g>
      ) : (
        <g transform={`translate(50 84) scale(${scale}) translate(-50 -84)`}>
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

function Flag({ x, y, gold, accent }: { x: number; y: number; gold: boolean; accent: string }) {
  return (
    <g>
      <rect x={x} y={y} width="2" height="16" fill="#6b4a22" />
      <path d={`M${x + 2} ${y + 1}h12l-4 5 4 5H${x + 2}z`} fill={gold ? '#f6c343' : accent} />
    </g>
  );
}

function Hut({ level, accent, gold }: PartProps) {
  return (
    <g>
      <rect x="28" y="56" width="44" height="28" rx="3" fill="#e6cfa4" />
      <rect x="28" y="56" width="44" height="28" rx="3" fill="none" stroke="#a9834a" strokeWidth="2" />
      <path d="M24 58l26-20 26 20z" fill={gold ? '#f6c343' : accent} />
      <path d="M30 58l20-15 20 15z" fill="rgba(255,255,255,0.25)" />
      <rect x="44" y="66" width="12" height="18" rx="2" fill="#8b5a2b" />
      <circle cx="53" cy="76" r="1.6" fill="#f6c343" />
      {level >= 2 && <rect x="32" y="62" width="9" height="9" rx="1.5" fill="#7cc6fe" stroke="#8b5a2b" strokeWidth="1.5" />}
      {level >= 3 && <rect x="59" y="62" width="9" height="9" rx="1.5" fill="#7cc6fe" stroke="#8b5a2b" strokeWidth="1.5" />}
      {level >= 4 && <Flag x={49} y={24} gold={gold} accent={accent} />}
      {gold && <path d="M24 58h52v3H24z" fill="#f6c343" />}
    </g>
  );
}

function Dock({ level, accent, gold }: PartProps) {
  return (
    <g>
      <rect x="18" y="70" width="64" height="7" rx="2" fill="#c08b53" />
      <rect x="18" y="70" width="64" height="3" fill="#e0b681" />
      <rect x="24" y="77" width="5" height="12" fill="#8b5a2b" />
      <rect x="48" y="77" width="5" height="12" fill="#8b5a2b" />
      <rect x="70" y="77" width="5" height="12" fill="#8b5a2b" />
      {level >= 2 && (
        <g>
          <path d="M30 62h30l-4 8H34z" fill={gold ? '#f6c343' : accent} />
          <rect x="42" y="46" width="3" height="16" fill="#8b5a2b" />
          <path d="M45 46h16l-16 12z" fill="#fff8e7" />
        </g>
      )}
      {level >= 3 && <rect x="62" y="58" width="14" height="12" rx="2" fill="#e6cfa4" stroke="#a9834a" strokeWidth="2" />}
      {level >= 4 && (
        <g>
          <rect x="20" y="52" width="3" height="18" fill="#6b4a22" />
          <circle cx="21" cy="50" r="5" fill="#f6c343" opacity="0.9" />
        </g>
      )}
      {gold && <path d="M18 68h64v3H18z" fill="#f6c343" />}
    </g>
  );
}

function Mill({ level, accent, gold }: PartProps) {
  return (
    <g>
      <path d="M36 84l4-34h20l4 34z" fill="#e6cfa4" stroke="#a9834a" strokeWidth="2" />
      <path d="M38 50h24l-12-12z" fill={gold ? '#f6c343' : accent} />
      <rect x="45" y="70" width="10" height="14" rx="2" fill="#8b5a2b" />
      <g className="origin-center" style={{ transformOrigin: '50px 52px' }}>
        <g className="animate-[spin_9s_linear_infinite]" style={{ transformOrigin: '50px 52px' }}>
          <rect x="48" y="28" width="4" height="24" rx="2" fill="#c08b53" />
          <rect x="48" y="52" width="4" height="24" rx="2" fill="#c08b53" />
          <rect x="26" y="50" width="24" height="4" rx="2" fill="#c08b53" />
          <rect x="50" y="50" width="24" height="4" rx="2" fill="#c08b53" />
          <circle cx="50" cy="52" r="4" fill="#8b5a2b" />
        </g>
      </g>
      {level >= 3 && <rect x="40" y="58" width="8" height="8" rx="1.5" fill="#7cc6fe" stroke="#8b5a2b" strokeWidth="1.5" />}
      {level >= 4 && <Flag x={49} y={22} gold={gold} accent={accent} />}
    </g>
  );
}

function Tower({ level, accent, gold }: PartProps) {
  return (
    <g>
      <rect x="36" y="44" width="28" height="40" rx="3" fill="#d9d3c4" stroke="#9b937f" strokeWidth="2" />
      <rect x="33" y="38" width="34" height="8" rx="2" fill="#bfb6a0" />
      <path d="M33 38h6v-6h5v6h6v-6h5v6h6v-6h5v6h1" fill="#bfb6a0" />
      <rect x="45" y="66" width="10" height="18" rx="2" fill="#6b4a22" />
      <rect x="44" y="50" width="12" height="10" rx="2" fill="#1b3358" />
      {level >= 3 && <path d="M30 44h40l-20-14z" fill={gold ? '#f6c343' : accent} />}
      {level >= 4 && <Flag x={49} y={16} gold={gold} accent={accent} />}
      {gold && <rect x="36" y="60" width="28" height="3" fill="#f6c343" />}
    </g>
  );
}

function Statue({ level, accent, gold }: PartProps) {
  return (
    <g>
      <rect x="32" y="74" width="36" height="10" rx="2" fill="#b9ae94" />
      <rect x="36" y="66" width="28" height="8" rx="2" fill="#cfc4a8" />
      <g fill={gold ? '#f6c343' : '#b6c0d4'}>
        <circle cx="50" cy="40" r="12" />
        <circle cx="40" cy="31" r="5" />
        <circle cx="60" cy="31" r="5" />
        <path d="M38 52h24l4 14H34z" />
      </g>
      <path d="M40 40c3-4 8-4 10-1-1 4-4 6-8 6-2 0-3-2-2-5z" fill="#3a4457" />
      <path d="M60 40c-3-4-8-4-10-1 1 4 4 6 8 6 2 0 3-2 2-5z" fill="#3a4457" />
      {level >= 3 && <path d="M62 54l12-8 3 5-12 8z" fill={accent} />}
      {level >= 4 && (
        <g>
          <circle cx="30" cy="60" r="4" fill="#f6c343" />
          <circle cx="70" cy="60" r="4" fill="#f6c343" />
        </g>
      )}
    </g>
  );
}

function Market({ level, accent, gold }: PartProps) {
  return (
    <g>
      <rect x="26" y="60" width="48" height="24" rx="3" fill="#e6cfa4" stroke="#a9834a" strokeWidth="2" />
      <g>
        <path d="M22 60l6-14h44l6 14z" fill="#fff8e7" />
        <path d="M28 46h9l-3 14h-9zM46 46h9l-3 14h-9zM64 46h8l4 14h-9z" fill={gold ? '#f6c343' : accent} />
      </g>
      <rect x="34" y="66" width="14" height="10" rx="2" fill="#c08b53" />
      <rect x="54" y="66" width="14" height="10" rx="2" fill="#c08b53" />
      {level >= 3 && (
        <g>
          <circle cx="41" cy="71" r="3" fill="#f6c343" />
          <circle cx="61" cy="71" r="3" fill="#ff8a5b" />
        </g>
      )}
      {level >= 4 && <Flag x={72} y={30} gold={gold} accent={accent} />}
    </g>
  );
}

function Forge({ level, accent, gold }: PartProps) {
  return (
    <g>
      <rect x="28" y="56" width="44" height="28" rx="3" fill="#9b8f7c" stroke="#6d6355" strokeWidth="2" />
      <path d="M24 58l26-18 26 18z" fill={gold ? '#f6c343' : accent} />
      <rect x="60" y="30" width="10" height="18" rx="2" fill="#6d6355" />
      <rect x="44" y="64" width="14" height="20" rx="2" fill="#3a3129" />
      <path d="M47 80c0-6 4-7 4-12 3 3 6 5 6 9 0 2-1 3-2 3z" fill="#ff8a5b" />
      {level >= 3 && <circle cx="65" cy="26" r="5" fill="rgba(255,255,255,0.5)" />}
      {level >= 4 && (
        <g>
          <rect x="30" y="64" width="10" height="8" rx="1.5" fill="#f6c343" />
          <rect x="30" y="74" width="10" height="8" rx="1.5" fill="#c98c14" />
        </g>
      )}
    </g>
  );
}

function Lighthouse({ level, accent, gold }: PartProps) {
  return (
    <g>
      <path d="M40 84l3-40h14l3 40z" fill="#fff8e7" stroke="#a9834a" strokeWidth="2" />
      <path d="M42 60h16l1 10H41z" fill={gold ? '#f6c343' : accent} />
      <path d="M43 46h14l1 8H42z" fill={gold ? '#f6c343' : accent} />
      <rect x="41" y="36" width="18" height="9" rx="2" fill="#3a4457" />
      <circle cx="50" cy="40" r="4" fill="#ffe9a8" />
      <path d="M44 32h12l-6-8z" fill="#c98c14" />
      {level >= 3 && (
        <g opacity="0.55">
          <path d="M59 36l26-8v18z" fill="#ffe9a8" />
          <path d="M41 36l-26-8v18z" fill="#ffe9a8" />
        </g>
      )}
      {level >= 4 && <rect x="36" y="80" width="28" height="6" rx="2" fill="#c08b53" />}
    </g>
  );
}
