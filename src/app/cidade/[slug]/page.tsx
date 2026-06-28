import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { City } from '@/lib/types';
import { getCityBySlug } from '@/lib/cities';
import { getForecast } from '@/lib/gfs';
import { buildView } from '@/lib/verdicts';
import { getZePhrases } from '@/lib/phrases';
import { searchPlaces, placeToCity } from '@/lib/geocode';
import { offsetHoursForZone } from '@/lib/tz';
import { VerdictGrid } from '@/components/VerdictCard';
import { FreeQuestionBox } from '@/components/FreeQuestionBox';
import { AgoraCard, RainAlert, ProximasHoras, ResumoZe, SevenDay, AstroGrid, Faq, H2, SectionLabel } from '@/components/WeatherSections';
import { JsonLd, breadcrumbSchema, faqSchema } from '@/components/JsonLd';

// Reads searchParams (for searched cities) → dynamic SSR. Data is still cached
// server-side (30 min) so ERDDAP isn't hit per visitor.
export const revalidate = 1800;

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Resolve a City from: (1) curated slug, (2) coords passed by the search box,
// (3) fallback geocoding of the slug name (so shared links work without params).
async function resolveCity(slug: string, sp: SP): Promise<City | null> {
  const curated = getCityBySlug(slug);
  if (curated) return curated;

  const lat = parseFloat(one(sp.lat) || '');
  const lon = parseFloat(one(sp.lon) || '');
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    const tzIana = one(sp.tz) || 'UTC';
    const country = one(sp.c) || '';
    return {
      n: one(sp.n) || slug,
      uf: one(sp.r) || country,
      country,
      lat,
      lon,
      slug,
      tz: offsetHoursForZone(tzIana),
    };
  }

  const name = slug.replace(/-[a-z]{2}$/, '').replace(/-/g, ' ');
  const places = await searchPlaces(name);
  return places.length ? placeToCity(places[0]) : null;
}

export async function generateMetadata({ params, searchParams }: { params: { slug: string }; searchParams: SP }): Promise<Metadata> {
  const city = await resolveCity(params.slug, searchParams);
  if (!city) return { title: 'Cidade não encontrada — BrasilTempo', robots: { index: false, follow: false } };
  const place = city.uf ? `${city.n}, ${city.uf}` : city.n;
  const title = `Tempo em ${place} — BrasilTempo`;
  const description = `Previsão do tempo em ${city.n} hoje e nos próximos dias: vai chover? dá praia? precisa de casaco? O BrasilTempo responde, ancorado em dados NOAA GFS.`;
  // Canonical drops any query params (lat/lon/tz used for shared/searched links)
  // so the param-free city URL is the single indexable version.
  const canonical = `/cidade/${params.slug}`;
  // Only the curated cities (the ones in the sitemap) are indexable. Long-tail
  // searched cities still render and work for users / shared links, but are
  // noindex,follow so Google doesn't index thousands of thin variants
  // (scaled-content-abuse guard). "follow" lets crawlers still reach the curated
  // pages linked from here.
  const curated = getCityBySlug(params.slug);
  return {
    title,
    description,
    alternates: { canonical },
    robots: curated ? undefined : { index: false, follow: true },
    openGraph: { title, description, url: canonical, locale: 'pt_BR', type: 'article' },
  };
}

export default async function CidadePage({ params, searchParams }: { params: { slug: string }; searchParams: SP }) {
  const city = await resolveCity(params.slug, searchParams);
  if (!city) notFound();

  // Curated cities get their own AI phrase bucket (worth pre-warming); long-tail
  // searched cities share the cheap global daily set.
  const curated = getCityBySlug(params.slug);
  const scope = curated
    ? { key: `city_${curated.slug}`, cityName: curated.n }
    : { key: 'global' };
  const forecast = await getForecast(city);
  const phrases = await getZePhrases(scope);
  const v = buildView(city, forecast, phrases);
  const place = city.uf ? `${city.n}, ${city.uf}` : city.n;

  // Structured data, all anchored to what's rendered below (breadcrumb + the
  // same data-driven FAQs the user sees).
  const schema = [
    breadcrumbSchema([
      { name: 'Início', path: '/' },
      { name: `Tempo em ${place}`, path: `/cidade/${params.slug}` },
    ]),
    faqSchema(v.faqs),
  ];

  return (
    <main className="container">
      <JsonLd data={schema} />
      <Link href="/" style={{ font: '600 13px var(--jakarta)', color: 'var(--blue)' }}>
        ← Voltar pro início
      </Link>

      <div style={{ font: '700 12px var(--jakarta)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 14 }}>
        Previsão do tempo
      </div>
      <h1 style={{ font: '800 32px/1.1 var(--jakarta)', color: 'var(--ink)', letterSpacing: '-.025em', margin: '5px 0 16px' }}>
        Tempo em {place}
      </h1>

      <FreeQuestionBox city={city} />

      <SectionLabel>Agora em {v.cidade}</SectionLabel>
      <AgoraCard v={v} />
      <RainAlert v={v} />

      <ProximasHoras v={v} />

      <SevenDay v={v} />

      <ResumoZe v={v} />

      <H2>O veredito pra cada coisa</H2>
      <VerdictGrid cards={v.cards} />

      <H2>Sobre o tempo em {city.n} hoje</H2>
      <p style={{ font: '500 15px/1.7 var(--jakarta)', color: '#3a4658' }}>{v.seoIntro}</p>

      <AstroGrid v={v} />
      <Faq v={v} />

      <p style={{ font: '500 12px var(--jakarta)', color: 'var(--muted-2)', marginTop: 24 }}>
        Fonte dos dados: {v.source} · atualizado {new Date(v.fetchedAt).toLocaleString('pt-BR')}.
      </p>
    </main>
  );
}
