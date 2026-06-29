// Renders one or more schema.org JSON-LD blocks. Server component — the markup
// is emitted in the SSR HTML so crawlers see it without running JS.
//
// We only emit structured data that is genuinely backed by what's on the page
// (the same data-anchored FAQs/forecast the user sees), never fabricated, so it
// stays within Google's structured-data guidelines.
export function JsonLd({ data }: { data: object | object[] }) {
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          // JSON.stringify output is safe here: it's our own structured object,
          // and stringify escapes the values. Guard the one XSS vector (`</`)
          // just in case a phrase ever contains a literal closing tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block).replace(/</g, '\\u003c') }}
        />
      ))}
    </>
  );
}

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

/** Site-wide WebSite + publisher, for the home page / brand entity. */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BrasilTempo',
    alternateName: 'Vai Dar?',
    url: `${SITE}/`,
    inLanguage: 'pt-BR',
    description:
      'Previsão do tempo brasileira com personalidade. O BrasilTempo responde perguntas da vida real — vai chover? rola praia? precisa de casaco? — ancorado em dados NOAA GFS.',
    publisher: {
      '@type': 'Organization',
      name: 'BrasilTempo',
      url: `${SITE}/`,
      logo: { '@type': 'ImageObject', url: `${SITE}/icon-512.png` },
    },
  };
}

/** Generic WebPage — for content pages without a richer type (e.g. legal). */
export function webPageSchema(p: { name: string; description: string; path: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: p.name,
    description: p.description,
    url: `${SITE}${p.path}`,
    inLanguage: 'pt-BR',
    isPartOf: { '@type': 'WebSite', name: 'BrasilTempo', url: `${SITE}/` },
  };
}

/** Blog landing page listing its posts. */
export function blogIndexSchema(posts: { title: string; description: string; slug: string; date: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog do BrasilTempo',
    description: 'O tempo explicado sem complicar — dicas, bastidores dos vereditos e curiosidades meteorológicas.',
    url: `${SITE}/blog`,
    inLanguage: 'pt-BR',
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.description,
      datePublished: p.date,
      url: `${SITE}/blog/${p.slug}`,
    })),
  };
}

/** Breadcrumb: Início › <page title>. */
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE}${it.path}`,
    })),
  };
}

/** BlogPosting/Article for a blog post. */
export function articleSchema(a: {
  title: string;
  description: string;
  path: string;
  date: string;
  updated?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: a.title,
    description: a.description,
    datePublished: a.date,
    dateModified: a.updated || a.date,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}${a.path}` },
    inLanguage: 'pt-BR',
    author: { '@type': 'Organization', name: 'BrasilTempo' },
    publisher: { '@type': 'Organization', name: 'BrasilTempo', url: `${SITE}/` },
  };
}

/** FAQPage from the page's data-anchored Q&A. Strips emojis for clean answers. */
export function faqSchema(faqs: { q: string; a: string }[]) {
  const clean = (s: string) =>
    s
      // drop emoji / pictographs that read as noise in a rich result
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}️]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: clean(f.q),
      acceptedAnswer: {
        '@type': 'Answer',
        text: clean(f.a),
      },
    })),
  };
}
