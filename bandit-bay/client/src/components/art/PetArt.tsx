interface Props {
  art: 'fuchs' | 'baer' | 'papagei' | 'erdmaennchen' | 'otter';
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

      {art === 'erdmaennchen' && (
        <g>
          <ellipse cx="60" cy="92" rx="20" ry="26" fill="#e0a55c" stroke={OUTLINE} strokeWidth="3.4" />
          <ellipse cx="60" cy="96" rx="12" ry="18" fill="#f4d3a5" />
          <path d="M80 104c12 6 16 14 12 20-8 0-15-5-18-12z" fill="#e0a55c" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="42" cy="44" r="9" fill="#e0a55c" stroke={OUTLINE} strokeWidth="3" />
          <circle cx="78" cy="44" r="9" fill="#e0a55c" stroke={OUTLINE} strokeWidth="3" />
          <ellipse cx="60" cy="52" rx="20" ry="24" fill="#eab978" stroke={OUTLINE} strokeWidth="3.4" />
          <path d="M60 30c11 0 20 7 22 17-7-4-14-6-22-6s-15 2-22 6c2-10 11-17 22-17z" fill="#e0a55c" />
          <ellipse cx="50" cy="48" rx="7" ry="8" fill="#4a3524" />
          <ellipse cx="70" cy="48" rx="7" ry="8" fill="#4a3524" />
          <circle cx="51" cy="47" r="3.4" fill="#fff" />
          <circle cx="71" cy="47" r="3.4" fill="#fff" />
          <ellipse cx="60" cy="64" rx="11" ry="9" fill="#fbe8cf" stroke={OUTLINE} strokeWidth="2.6" />
          <path d="M36 96c-6 4-9 10-7 14 6 1 11-2 14-7z" fill="#e0a55c" stroke={OUTLINE} strokeWidth="2.8" strokeLinejoin="round" />
          <path d="M60 57l5 4-5 4-5-4z" fill="#1c2231" />
          <path d={happy ? 'M53 69c4 4 10 4 14 0' : 'M54 69h12'} stroke={OUTLINE} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </g>
      )}

      {art === 'otter' && (
        <g>
          <path d="M28 96c-14 8-18 18-12 24 10 0 19-6 23-15z" fill="#8d6a4f" stroke={OUTLINE} strokeWidth="3.2" strokeLinejoin="round" />
          <ellipse cx="62" cy="92" rx="26" ry="24" fill="#a77f5e" stroke={OUTLINE} strokeWidth="3.4" />
          <ellipse cx="62" cy="96" rx="16" ry="16" fill="#e3c9a8" />
          <circle cx="42" cy="36" r="8" fill="#8d6a4f" stroke={OUTLINE} strokeWidth="3" />
          <circle cx="80" cy="36" r="8" fill="#8d6a4f" stroke={OUTLINE} strokeWidth="3" />
          <circle cx="61" cy="52" r="27" fill="#a77f5e" stroke={OUTLINE} strokeWidth="3.4" />
          <path d="M61 27c12 0 22 8 25 19-8-5-16-7-25-7s-17 2-25 7c3-11 13-19 25-19z" fill="#8d6a4f" />
          <circle cx="50" cy="50" r="5.5" fill="#fff" stroke={OUTLINE} strokeWidth="2" />
          <circle cx="72" cy="50" r="5.5" fill="#fff" stroke={OUTLINE} strokeWidth="2" />
          <circle cx="51" cy="51" r="2.8" fill="#1c2231" />
          <circle cx="73" cy="51" r="2.8" fill="#1c2231" />
          <ellipse cx="61" cy="65" rx="15" ry="11" fill="#f4e3cd" stroke={OUTLINE} strokeWidth="2.6" />
          <ellipse cx="61" cy="60" rx="5" ry="4" fill="#1c2231" />
          <path d={happy ? 'M53 70c5 5 11 5 16 0' : 'M54 70h14'} stroke={OUTLINE} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M46 74c-6 2-10 2-14 0M76 74c6 2 10 2 14 0" stroke={OUTLINE} strokeWidth="2" fill="none" strokeLinecap="round" />
          <g transform="translate(62 100)">
            <path d="M-11 0c0-7 5-12 11-12s11 5 11 12z" fill="#ffd6e4" stroke="#b9698a" strokeWidth="2.6" strokeLinejoin="round" />
            <path d="M0 -12v12M-6 -10l-2 10M6 -10l2 10" stroke="#e8a6c0" strokeWidth="2" />
          </g>
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
