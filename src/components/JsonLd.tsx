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
      'Previsão do tempo brasileira com personalidade. O Zé do Tempo responde perguntas da vida real — vai chover? rola praia? precisa de casaco? — ancorado em dados NOAA GFS.',
    publisher: {
      '@type': 'Organization',
      name: 'BrasilTempo',
      url: `${SITE}/`,
    },
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
    author: { '@type': 'Person', name: 'Zé do Tempo' },
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
