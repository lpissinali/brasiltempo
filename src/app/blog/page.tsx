import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog — BrasilTempo',
  description: 'O tempo explicado sem complicar — dicas, bastidores dos vereditos e curiosidades meteorológicas no jeitão do Zé.',
};

// Placeholder for the content/SEO engine described in the brief (§3.3).
// Real posts (data-anchored, genuinely useful) come later — generated/cached
// on a schedule, never spam.
const POSTS = [
  { title: 'Como o Zé decide se vai chover', tag: 'Bastidores', resumo: 'Os critérios por trás de cada veredito, em português claro.' },
  { title: 'O que é índice UV e quando se preocupar', tag: 'Saúde', resumo: 'Do "relaxa" ao "passa agora": o que os números do sol querem dizer.' },
  { title: 'Dá pra confiar na previsão de 7 dias?', tag: 'Curiosidade', resumo: 'Por que o tempo de hoje é mais certo que o de sábado.' },
];

export default function BlogPage() {
  return (
    <main className="container">
      <div style={{ font: '700 12px var(--jakarta)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        Blog
      </div>
      <h1 style={{ font: '800 32px/1.1 var(--jakarta)', color: 'var(--ink)', letterSpacing: '-.025em', margin: '5px 0 6px' }}>
        O tempo explicado sem complicar
      </h1>
      <p style={{ font: '500 15px/1.7 var(--jakarta)', color: '#3a4658', maxWidth: 560 }}>
        Dicas, bastidores dos vereditos e curiosidades meteorológicas — tudo no jeitão do Zé, pra você
        entender o céu sem precisar virar meteorologista.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
        {POSTS.map((p) => (
          <div key={p.title} className="card" style={{ padding: 18 }}>
            <span style={{ font: '700 11px var(--jakarta)', letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--blue)' }}>
              {p.tag}
            </span>
            <div style={{ font: '800 18px var(--jakarta)', color: 'var(--ink)', margin: '6px 0 4px' }}>{p.title}</div>
            <p style={{ font: '500 14px/1.6 var(--jakarta)', color: '#3a4658' }}>{p.resumo}</p>
            <span style={{ font: '600 13px var(--jakarta)', color: 'var(--muted-2)' }}>Em breve · Por Zé do Tempo</span>
          </div>
        ))}
      </div>

      <Link href="/" style={{ display: 'inline-block', marginTop: 24, font: '600 13px var(--jakarta)', color: 'var(--blue)' }}>
        ← Voltar pro Zé
      </Link>
    </main>
  );
}
