import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { POSTS, getPost, formatDate } from '@/lib/posts';
import { JsonLd, articleSchema, breadcrumbSchema, faqSchema } from '@/components/JsonLd';

// Static, evergreen content — fully prerendered. All posts are known at build
// time, so we can generate every slug and let it be cached indefinitely.
export const dynamicParams = false;

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPost(params.slug);
  if (!post) return { title: 'Post não encontrado — BrasilTempo', robots: { index: false, follow: true } };
  const canonical = `/blog/${post.slug}`;
  return {
    title: `${post.title} — BrasilTempo`,
    description: post.description,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description: post.description,
      url: canonical,
      type: 'article',
      locale: 'pt_BR',
      publishedTime: post.date,
      modifiedTime: post.updated || post.date,
      images: ['/og.png'],
    },
  };
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  const schema: object[] = [
    breadcrumbSchema([
      { name: 'Início', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
    articleSchema({
      title: post.title,
      description: post.description,
      path: `/blog/${post.slug}`,
      date: post.date,
      updated: post.updated,
    }),
  ];
  if (post.faqs?.length) schema.push(faqSchema(post.faqs));

  const more = POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <main className="container">
      <JsonLd data={schema} />

      <Link href="/blog" style={{ font: '600 13px var(--jakarta)', color: 'var(--blue)' }}>
        ← Blog
      </Link>

      <article style={{ marginTop: 14 }}>
        <span style={{ font: '700 11px var(--jakarta)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--blue)' }}>
          {post.tag}
        </span>
        <h1 style={{ font: '800 34px/1.15 var(--jakarta)', color: 'var(--ink)', letterSpacing: '-.025em', margin: '6px 0 10px', maxWidth: 720 }}>
          {post.title}
        </h1>
        <div style={{ font: '600 13px var(--jakarta)', color: 'var(--muted)', marginBottom: 24 }}>
          Por BrasilTempo · {formatDate(post.updated || post.date)} · {post.readingMin} min de leitura
        </div>

        <div className="article">
          <post.Body />
        </div>

        {post.faqs?.length ? (
          <section className="article" style={{ marginTop: 8 }}>
            <h2>Perguntas rápidas</h2>
            {post.faqs.map((f, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <h3 style={{ margin: '0 0 4px' }}>{f.q}</h3>
                <p style={{ margin: 0 }}>{f.a}</p>
              </div>
            ))}
          </section>
        ) : null}
      </article>

      {more.length ? (
        <aside style={{ marginTop: 40, borderTop: '1px solid var(--line)', paddingTop: 22 }}>
          <div style={{ font: '700 12px var(--jakarta)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 12 }}>
            Continue lendo
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {more.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="card" style={{ padding: 16, display: 'block' }}>
                <span style={{ font: '700 11px var(--jakarta)', letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--blue)' }}>{p.tag}</span>
                <div style={{ font: '800 16px/1.3 var(--jakarta)', color: 'var(--ink)', margin: '6px 0 4px' }}>{p.title}</div>
                <p style={{ font: '500 13px/1.55 var(--jakarta)', color: '#3a4658', margin: 0 }}>{p.description}</p>
              </Link>
            ))}
          </div>
        </aside>
      ) : null}
    </main>
  );
}
