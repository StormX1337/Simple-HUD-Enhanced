interface Props {
  size?: number;
  className?: string;
  cheer?: boolean;
}

/** Rufus – das Maskottchen von Bandit Bay. */
export function Raccoon({ size = 96, className = '', cheer = false }: Props): JSX.Element {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden="true">
      {/* Schwanz */}
      <g transform={cheer ? 'rotate(-12 30 92)' : undefined}>
        <path d="M30 92c-16 2-24-8-22-20 2-12 14-16 22-12z" fill="#9aa6bd" />
        <path d="M22 74c-6 3-8 9-6 14 5 3 10 2 14-1z" fill="#4b5872" />
        <path d="M12 80c-2 4-1 8 2 11 3-1 5-3 6-6z" fill="#9aa6bd" />
      </g>
      {/* Koerper */}
      <ellipse cx="60" cy="86" rx="30" ry="26" fill="#9aa6bd" />
      <ellipse cx="60" cy="90" rx="20" ry="18" fill="#d7deeb" />
      {/* Ohren */}
      <circle cx="34" cy="40" r="13" fill="#9aa6bd" />
      <circle cx="34" cy="40" r="7" fill="#d29fb4" />
      <circle cx="86" cy="40" r="13" fill="#9aa6bd" />
      <circle cx="86" cy="40" r="7" fill="#d29fb4" />
      {/* Kopf */}
      <circle cx="60" cy="52" r="32" fill="#b6c0d4" />
      <path d="M60 22c16 0 29 12 30 27-8-6-19-9-30-9s-22 3-30 9c1-15 14-27 30-27z" fill="#9aa6bd" />
      {/* Maske */}
      <path d="M30 52c6-8 15-10 22-6-2 8-8 14-16 15-4 0-6-4-6-9z" fill="#3a4457" />
      <path d="M90 52c-6-8-15-10-22-6 2 8 8 14 16 15 4 0 6-4 6-9z" fill="#3a4457" />
      <circle cx="45" cy="52" r="5" fill="#fff8e7" />
      <circle cx="75" cy="52" r="5" fill="#fff8e7" />
      <circle cx="46" cy="53" r="2.6" fill="#1c2231" />
      <circle cx="76" cy="53" r="2.6" fill="#1c2231" />
      {/* Schnauze */}
      <ellipse cx="60" cy="66" rx="16" ry="12" fill="#f2f4f9" />
      <path d="M60 60l6 5-6 5-6-5z" fill="#1c2231" />
      <path d="M60 70v4" stroke="#1c2231" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M60 74c-3 3-7 2-8-1M60 74c3 3 7 2 8-1" stroke="#1c2231" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Pfoten */}
      <circle cx="38" cy={cheer ? 66 : 96} r="9" fill="#8e9ab1" />
      <circle cx="82" cy={cheer ? 66 : 96} r="9" fill="#8e9ab1" />
    </svg>
  );
}
