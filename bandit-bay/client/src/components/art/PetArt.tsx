interface Props {
  art: 'fuchs' | 'baer' | 'papagei';
  size?: number;
  className?: string;
  happy?: boolean;
}

const OUTLINE = '#3b2412';

/** Begleiter-Tiere als Cartoon-SVG. */
export function PetArt({ art, size = 92, className = '', happy = false }: Props): JSX.Element {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      style={{ filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.3))' }}
      aria-hidden="true"
    >
      {art === 'fuchs' && (
        <g>
          <path d="M28 100c-14-4-20-14-16-24 4-9 14-11 22-7z" fill="#ff9a3c" stroke={OUTLINE} strokeWidth="3.4" strokeLinejoin="round" />
          <path d="M18 84c-6 3-8 8-6 12 5 2 9 1 12-2z" fill="#fff6e2" stroke={OUTLINE} strokeWidth="2.6" />
          <ellipse cx="62" cy="92" rx="27" ry="23" fill="#ff9a3c" stroke={OUTLINE} strokeWidth="3.4" />
          <ellipse cx="62" cy="97" rx="17" ry="15" fill="#fff6e2" />
          <path d="M34 40l6 26 16-10z" fill="#ff9a3c" stroke={OUTLINE} strokeWidth="3.2" strokeLinejoin="round" />
          <path d="M38 46l3 14 8-5z" fill="#e0533c" />
          <path d="M90 40l-6 26-16-10z" fill="#ff9a3c" stroke={OUTLINE} strokeWidth="3.2" strokeLinejoin="round" />
          <path d="M86 46l-3 14-8-5z" fill="#e0533c" />
          <circle cx="62" cy="58" r="28" fill="#ffb25e" stroke={OUTLINE} strokeWidth="3.4" />
          <path d="M62 40c12 0 22 7 26 18-8-4-17-6-26-6s-18 2-26 6c4-11 14-18 26-18z" fill="#ff9a3c" />
          <ellipse cx="62" cy="72" rx="16" ry="12" fill="#fff6e2" stroke={OUTLINE} strokeWidth="2.6" />
          <circle cx="51" cy="56" r="5" fill="#fff" stroke={OUTLINE} strokeWidth="2" />
          <circle cx="73" cy="56" r="5" fill="#fff" stroke={OUTLINE} strokeWidth="2" />
          <circle cx="52" cy="57" r="2.6" fill="#1c2231" />
          <circle cx="74" cy="57" r="2.6" fill="#1c2231" />
          <path d="M62 66l5 4-5 4-5-4z" fill="#1c2231" />
          <path d={happy ? 'M56 78c4 4 8 4 12 0' : 'M57 78h10'} stroke={OUTLINE} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </g>
      )}

      {art === 'baer' && (
        <g>
          <circle cx="34" cy="42" r="14" fill="#b5834a" stroke={OUTLINE} strokeWidth="3.4" />
          <circle cx="34" cy="42" r="7" fill="#e0b98a" />
          <circle cx="86" cy="42" r="14" fill="#b5834a" stroke={OUTLINE} strokeWidth="3.4" />
          <circle cx="86" cy="42" r="7" fill="#e0b98a" />
          <ellipse cx="60" cy="94" rx="30" ry="24" fill="#b5834a" stroke={OUTLINE} strokeWidth="3.4" />
          <ellipse cx="60" cy="98" rx="19" ry="16" fill="#e0b98a" />
          <circle cx="60" cy="58" r="31" fill="#c08b53" stroke={OUTLINE} strokeWidth="3.4" />
          <ellipse cx="60" cy="74" rx="19" ry="14" fill="#f0d7a8" stroke={OUTLINE} strokeWidth="2.8" />
          <circle cx="48" cy="54" r="5" fill="#fff" stroke={OUTLINE} strokeWidth="2" />
          <circle cx="72" cy="54" r="5" fill="#fff" stroke={OUTLINE} strokeWidth="2" />
          <circle cx="49" cy="55" r="2.6" fill="#1c2231" />
          <circle cx="73" cy="55" r="2.6" fill="#1c2231" />
          <ellipse cx="60" cy="69" rx="7" ry="5" fill="#1c2231" />
          <path d={happy ? 'M52 80c5 5 11 5 16 0' : 'M53 80h14'} stroke={OUTLINE} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        </g>
      )}

      {art === 'papagei' && (
        <g>
          <path d="M84 78c14 8 20 20 14 30-12-2-22-10-26-20z" fill="#4fc3a1" stroke={OUTLINE} strokeWidth="3.2" strokeLinejoin="round" />
          <ellipse cx="58" cy="80" rx="26" ry="30" fill="#4fc3a1" stroke={OUTLINE} strokeWidth="3.4" />
          <ellipse cx="52" cy="86" rx="15" ry="20" fill="#7ce0bf" />
          <path d="M74 66c14 6 18 20 12 32-8-4-14-12-16-22z" fill="#3aa383" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="56" cy="44" r="24" fill="#ffd95e" stroke={OUTLINE} strokeWidth="3.4" />
          <path d="M56 22c10 0 18 6 22 14-7-3-14-5-22-5s-15 2-22 5c4-8 12-14 22-14z" fill="#ffe9a0" />
          <circle cx="48" cy="42" r="5.5" fill="#fff" stroke={OUTLINE} strokeWidth="2" />
          <circle cx="49" cy="43" r="2.8" fill="#1c2231" />
          <path
            d="M70 40c10 0 16 6 16 12s-8 10-14 6c3-4 3-10-2-12z"
            fill="#ff8a3c"
            stroke={OUTLINE}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M40 22c2-8 8-12 14-12-4 4-6 8-6 13z" fill="#e0533c" stroke={OUTLINE} strokeWidth="2.6" strokeLinejoin="round" />
          <rect x="46" y="104" width="8" height="12" rx="4" fill="#ff8a3c" stroke={OUTLINE} strokeWidth="2.6" />
          <rect x="62" y="104" width="8" height="12" rx="4" fill="#ff8a3c" stroke={OUTLINE} strokeWidth="2.6" />
        </g>
      )}
    </svg>
  );
}
