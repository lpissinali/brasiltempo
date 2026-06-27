import type { VerdictCardData } from '@/lib/types';

// Append an alpha channel to a 6-digit hex color (e.g. '#2E7BD6' + 0.08).
function tint(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

export function VerdictCard({ card }: { card: VerdictCardData }) {
  return (
    <div
      className="card"
      style={{
        padding: '20px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 184,
      }}
    >
      {/* accent hairline along the top edge */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: card.accent }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            fontSize: 18,
            width: 36,
            height: 36,
            flex: '0 0 auto',
            borderRadius: 11,
            display: 'grid',
            placeItems: 'center',
            background: tint(card.accent, 0.1),
          }}
        >
          {card.icon}
        </span>
        <span style={{ font: '700 12.5px/1.25 var(--jakarta)', color: 'var(--muted)' }}>{card.q}</span>
      </div>

      <div style={{ font: '800 26px/1.02 var(--jakarta)', color: card.accent, letterSpacing: '-.02em' }}>
        {card.big}
      </div>

      <div style={{ font: '500 13.5px/1.5 var(--jakarta)', color: 'var(--ink)', fontStyle: 'italic' }}>
        “{card.ze}”
      </div>

      <div
        style={{
          marginTop: 'auto',
          alignSelf: 'flex-start',
          font: '700 11px var(--jakarta)',
          color: card.accent,
          background: tint(card.accent, 0.09),
          padding: '4px 10px',
          borderRadius: 999,
        }}
      >
        {card.meta}
      </div>
    </div>
  );
}

export function VerdictGrid({ cards }: { cards: VerdictCardData[] }) {
  return (
    <div
      style={{
        display: 'grid',
        // 2–3 cards fill the row evenly on desktop and wrap gracefully when narrow.
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: 14,
      }}
    >
      {cards.map((c) => (
        <VerdictCard key={c.key} card={c} />
      ))}
    </div>
  );
}
