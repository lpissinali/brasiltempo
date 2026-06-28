import type { Metadata } from 'next';
import Link from 'next/link';
import { POSTS, formatDate } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'Blog — BrasilTempo',
  description:
    'O tempo explicado sem complicar — dicas, bastidores dos vereditos e curiosidades meteorológicas no jeitão do BrasilTempo. Como ler a chuva, o índice UV e a previsão de 7 dias.',
  alternates: { canonical: '/blog' },
};

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
        Dicas, bastidores dos vereditos e curiosidades meteorológicas — tudo sem juridiquês, pra você
        entender o céu sem precisar virar meteorologista.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
        {POSTS.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="card" style={{ padding: 18, display: 'block' }}>
            <span style={{ font: '700 11px var(--jakarta)', letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--blue)' }}>
              {p.tag}
            </span>
            <div style={{ font: '800 18px/1.3 var(--jakarta)', color: 'var(--ink)', margin: '6px 0 4px' }}>{p.title}</div>
            <p style={{ font: '500 14px/1.6 var(--jakarta)', color: '#3a4658' }}>{p.description}</p>
            <span style={{ font: '600 13px var(--jakarta)', color: 'var(--muted-2)' }}>
              {formatDate(p.date)} · {p.readingMin} min · Por BrasilTempo
            </span>
          </Link>
        ))}
      </div>

      <Link href="/" style={{ display: 'inline-block', marginTop: 24, font: '600 13px var(--jakarta)', color: 'var(--blue)' }}>
        ← Voltar pro início
      </Link>
    </main>
  );
}
