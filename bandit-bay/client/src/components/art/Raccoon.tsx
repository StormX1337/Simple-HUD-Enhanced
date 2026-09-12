interface Props {
  size?: number;
  className?: string;
  cheer?: boolean;
}

const OUTLINE = '#2b3242';

/** Rufus – das Maskottchen von Bandit Bay (Cartoon-Waschbär). */
export function Raccoon({ size = 96, className = '', cheer = false }: Props): JSX.Element {
  return (
    <svg
      viewBox="0 0 130 130"
      width={size}
      height={size}
      className={className}
      style={{ filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.3))' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="rc-fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d7dfee" />
          <stop offset="60%" stopColor="#aab6cd" />
          <stop offset="100%" stopColor="#8593ad" />
        </linearGradient>
        <linearGradient id="rc-belly" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dfe6f2" />
        </linearGradient>
      </defs>

      {/* Schwanz */}
      <g transform={cheer ? 'rotate(-14 34 100)' : 'rotate(-4 34 100)'}>
        <path
          d="M34 102c-20 3-30-10-26-24 4-14 18-18 28-13z"
          fill="url(#rc-fur)"
          stroke={OUTLINE}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M24 82c-7 3-10 10-7 17 6 3 12 2 16-2z" fill="#5b6880" />
        <path d="M12 88c-3 5-2 10 2 13 4-1 6-4 7-8z" fill="#8593ad" />
      </g>

      {/* Körper */}
      <ellipse cx="65" cy="96" rx="32" ry="27" fill="url(#rc-fur)" stroke={OUTLINE} strokeWidth="3.4" />
      <ellipse cx="65" cy="100" rx="21" ry="19" fill="url(#rc-belly)" stroke={OUTLINE} strokeWidth="2.4" />

      {/* Ohren */}
      <circle cx="37" cy="42" r="14" fill="url(#rc-fur)" stroke={OUTLINE} strokeWidth="3.2" />
      <circle cx="37" cy="42" r="7" fill="#e59aad" />
      <circle cx="93" cy="42" r="14" fill="url(#rc-fur)" stroke={OUTLINE} strokeWidth="3.2" />
      <circle cx="93" cy="42" r="7" fill="#e59aad" />

      {/* Kopf */}
      <circle cx="65" cy="56" r="34" fill="url(#rc-fur)" stroke={OUTLINE} strokeWidth="3.4" />
      <path d="M65 24c17 0 31 12 33 28-9-7-20-10-33-10s-24 3-33 10c2-16 16-28 33-28z" fill="#93a1ba" />

      {/* Banditenmaske */}
      <path
        d="M33 56c7-10 18-12 26-7-2 10-9 17-19 18-5 0-8-5-7-11z"
        fill="#38415a"
        stroke={OUTLINE}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path
        d="M97 56c-7-10-18-12-26-7 2 10 9 17 19 18 5 0 8-5 7-11z"
        fill="#38415a"
        stroke={OUTLINE}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="56" r="7" fill="#ffffff" stroke={OUTLINE} strokeWidth="2" />
      <circle cx="80" cy="56" r="7" fill="#ffffff" stroke={OUTLINE} strokeWidth="2" />
      <circle cx="51.5" cy="57" r="3.6" fill="#1c2231" />
      <circle cx="81.5" cy="57" r="3.6" fill="#1c2231" />
      <circle cx="53" cy="55" r="1.3" fill="#fff" />
      <circle cx="83" cy="55" r="1.3" fill="#fff" />

      {/* Schnauze */}
      <ellipse cx="65" cy="72" rx="18" ry="13" fill="#f4f7fc" stroke={OUTLINE} strokeWidth="2.6" />
      <path d="M65 64l7 6-7 6-7-6z" fill="#1c2231" />
      <path d="M65 76v4" stroke={OUTLINE} strokeWidth="2.6" strokeLinecap="round" />
      <path
        d="M65 80c-3 4-8 3-10-1M65 80c3 4 8 3 10-1"
        stroke={OUTLINE}
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />

      {/* Pfoten */}
      <circle cx="40" cy={cheer ? 70 : 106} r="10" fill="#8593ad" stroke={OUTLINE} strokeWidth="3" />
      <circle cx="90" cy={cheer ? 70 : 106} r="10" fill="#8593ad" stroke={OUTLINE} strokeWidth="3" />
      {cheer && (
        <g>
          <circle cx="97" cy="62" r="9" fill="#f8c73c" stroke="#7a4a05" strokeWidth="2.6" />
          <circle cx="97" cy="62" r="4.6" fill="none" stroke="#c8900f" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}
