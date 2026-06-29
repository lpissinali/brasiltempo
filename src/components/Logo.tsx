// BrasilTempo symbol — official artwork: golden sun with rounded rays over two
// blue waves. Transparent (no tile); reads well on light and on the dark header.
const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function Logo({ size = 32, bob = false }: { size?: number; bob?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ display: 'block', flex: 'none' }}
      className={bob ? 'bob' : undefined}
      aria-hidden
    >
      <g fill="#FFC83D">
        {RAY_ANGLES.map((a) => (
          <rect key={a} x="47.5" y="6" width="5" height="13" rx="2.5" transform={`rotate(${a} 50 44)`} />
        ))}
      </g>
      <circle cx="50" cy="44" r="19" fill="#FFC83D" />
      <path d="M10 72 q9 -8 18 0 t18 0 t18 0 t18 0" fill="none" stroke="#2E7BD6" strokeWidth="6" strokeLinecap="round" />
      <path d="M15 84 q9 -8 18 0 t18 0 t18 0" fill="none" stroke="#2E7BD6" strokeWidth="6" strokeLinecap="round" />
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
