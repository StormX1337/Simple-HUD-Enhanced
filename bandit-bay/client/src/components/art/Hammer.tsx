interface Props {
  size?: number;
  className?: string;
}

/** Großer Sturmhammer für die Angriffs-Animation. */
export function Hammer({ size = 120, className = '' }: Props): JSX.Element {
  return (
    <svg
      viewBox="0 0 120 160"
      width={size}
      height={size * 1.33}
      className={className}
      style={{ filter: 'drop-shadow(0 6px 4px rgba(0,0,0,0.45))' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hm-steel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd2c0" />
          <stop offset="40%" stopColor="#ff7f56" />
          <stop offset="100%" stopColor="#b83b1c" />
        </linearGradient>
        <linearGradient id="hm-wood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c98a4b" />
          <stop offset="100%" stopColor="#7a441c" />
        </linearGradient>
      </defs>
      <rect x="50" y="46" width="18" height="108" rx="9" fill="url(#hm-wood)" stroke="#3b2412" strokeWidth="4" />
      <path d="M57 60v82" stroke="#e0ab6c" strokeWidth="4" strokeLinecap="round" opacity="0.65" />
      <path
        d="M12 10h94a8 8 0 0 1 8 8v26a8 8 0 0 1-8 8H12a8 8 0 0 1-8-8V18a8 8 0 0 1 8-8z"
        fill="url(#hm-steel)"
        stroke="#3b2412"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <rect x="12" y="17" width="94" height="9" rx="4.5" fill="#ffd2c0" opacity="0.7" />
      <rect x="44" y="4" width="30" height="52" rx="6" fill="#f8c73c" stroke="#3b2412" strokeWidth="4.5" />
      <circle cx="59" cy="28" r="6" fill="#a96a05" />
    </svg>
  );
}
