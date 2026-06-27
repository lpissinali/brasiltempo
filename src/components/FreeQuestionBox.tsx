'use client';

import { useState } from 'react';
import type { City } from '@/lib/types';

interface Answer { verdict: string; ze: string; meta: string; icon: string; accent: string; }

export function FreeQuestionBox({ city }: { city: City }) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const CHIPS = ['Posso correr de tarde?', 'Levo o cachorro pra passear?', 'Vai dar pra soltar pipa?'];

  async function ask(text?: string) {
    const question = (text ?? q).trim();
    if (!question || loading) return;
    if (text) setQ(text);
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/pergunta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, city }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'erro');
      setAnswer(data);
    } catch (e: any) {
      setErr(e.message || 'O Zé tropeçou. Tenta de novo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: 'var(--ink)', borderRadius: 20, padding: 18, boxShadow: '0 14px 34px rgba(20,40,70,.16)' }}>
      <div style={{ font: '700 12px var(--jakarta)', letterSpacing: '.05em', textTransform: 'uppercase', color: '#9fb2c8' }}>
        Pergunta o que quiser pro Zé
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()}
          placeholder="posso correr hoje de tarde?"
          style={{ flex: 1, appearance: 'none', border: '1px solid #38465a', background: '#222f40', color: '#fff', borderRadius: 14, padding: '12px 14px', font: '600 14px var(--jakarta)', outline: 'none' }}
        />
        <button onClick={() => ask()} disabled={loading} style={{ appearance: 'none', border: 'none', cursor: 'pointer', background: 'var(--blue)', color: '#fff', borderRadius: 14, padding: '0 18px', font: '700 14px var(--jakarta)', opacity: loading ? 0.6 : 1 }}>
          {loading ? '...' : 'Vai dar?'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        {CHIPS.map((c) => (
          <button key={c} onClick={() => ask(c)} style={{ appearance: 'none', cursor: 'pointer', border: '1px solid #38465a', background: '#222f40', color: '#cdd8e6', borderRadius: 16, padding: '6px 12px', font: '600 12px var(--jakarta)' }}>
            {c}
          </button>
        ))}
      </div>

      {err && <div style={{ marginTop: 12, color: '#ff9a9a', font: '600 13px var(--jakarta)' }}>{err}</div>}

      {answer && (
        <div style={{ marginTop: 14, background: '#fff', borderRadius: 14, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>{answer.icon}</span>
            <span style={{ font: '800 20px var(--jakarta)', color: answer.accent }}>{answer.verdict}</span>
          </div>
          <div style={{ marginTop: 6, font: '600 14px/1.4 var(--jakarta)', color: 'var(--ink)', fontStyle: 'italic' }}>“{answer.ze}”</div>
          <div style={{ marginTop: 4, font: '600 11px var(--jakarta)', color: 'var(--muted-2)' }}>{answer.meta}</div>
        </div>
      )}
    </div>
  );
}
