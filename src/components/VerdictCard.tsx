import type { VerdictCardData } from '@/lib/types';

export function VerdictCard({ card }: { card: VerdictCardData }) {
  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>{card.icon}</span>
        <span style={{ font: '700 12px var(--jakarta)', color: 'var(--muted)' }}>{card.q}</span>
      </div>
      <div style={{ font: '800 22px var(--jakarta)', color: card.accent, letterSpacing: '-.01em' }}>
        {card.big}
      </div>
      <div style={{ font: '600 13px/1.4 var(--jakarta)', color: 'var(--ink)', fontStyle: 'italic' }}>
        “{card.ze}”
      </div>
      <div style={{ font: '600 11px var(--jakarta)', color: 'var(--muted-2)', marginTop: 2 }}>
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
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 12,
      }}
    >
      {cards.map((c) => (
        <VerdictCard key={c.key} card={c} />
      ))}
    </div>
  );
}
