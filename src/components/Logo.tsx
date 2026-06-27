// BrasilTempo mark — blue rounded square with sun + cloud (ported from prototype).
export function Logo({ size = 32, bob = false }: { size?: number; bob?: boolean }) {
  return (
    <svg
      viewBox="0 0 36 36"
      width={size}
      height={size}
      style={{ display: 'block', flex: 'none' }}
      className={bob ? 'bob' : undefined}
      aria-hidden
    >
      <rect width="36" height="36" rx="10" fill="#2E7BD6" />
      <circle cx="13.5" cy="13" r="6" fill="#FFC83D" />
      <g fill="#ffffff">
        <circle cx="16" cy="25" r="5" />
        <circle cx="23" cy="24" r="6.5" />
        <rect x="12" y="24" width="16" height="7.5" rx="3.75" />
      </g>
    </svg>
  );
}

export function Wordmark({ size = 18, light = false }: { size?: number; light?: boolean }) {
  return (
    <span style={{ font: `800 ${size}px var(--jakarta)`, letterSpacing: '-.02em' }}>
      <span style={{ color: light ? '#fff' : 'var(--ink)' }}>Brasil</span>
      <span style={{ color: 'var(--blue-light)' }}>Tempo</span>
    </span>
  );
}
