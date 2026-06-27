import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { City } from '@/lib/types';
import { getCityBySlug } from '@/lib/cities';
import { getForecast } from '@/lib/gfs';
import { buildView } from '@/lib/verdicts';
import { searchPlaces, placeToCity } from '@/lib/geocode';
import { offsetHoursForZone } from '@/lib/tz';
import { VerdictGrid } from '@/components/VerdictCard';
import { FreeQuestionBox } from '@/components/FreeQuestionBox';
import { AgoraCard, RainAlert, ProximasHoras, ResumoZe, SevenDay, AstroGrid, Faq, H2, SectionLabel } from '@/components/WeatherSections';

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
  if (!city) return { title: 'Cidade não encontrada — BrasilTempo' };
  const place = city.uf ? `${city.n}, ${city.uf}` : city.n;
  const title = `Tempo em ${place} — BrasilTempo`;
  const description = `Previsão do tempo em ${city.n} hoje e nos próximos dias: vai chover? dá praia? precisa de casaco? O Zé do Tempo responde, ancorado em dados NOAA GFS.`;
  return { title, description, openGraph: { title, description, locale: 'pt_BR', type: 'article' } };
}

export default async function CidadePage({ params, searchParams }: { params: { slug: string }; searchParams: SP }) {
  const city = await resolveCity(params.slug, searchParams);
  if (!city) notFound();

  const forecast = await getForecast(city);
  const v = buildView(city, forecast);
  const place = city.uf ? `${city.n}, ${city.uf}` : city.n;

  return (
    <main className="container">
      <Link href="/" style={{ font: '600 13px var(--jakarta)', color: 'var(--blue)' }}>
        ← Voltar pro Zé
      </Link>

      <div style={{ font: '700 12px var(--jakarta)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 14 }}>
        Previsão do tempo
      </div>
      <h1 style={{ font: '800 32px/1.1 var(--jakarta)', color: 'var(--ink)', letterSpacing: '-.025em', margin: '5px 0 16px' }}>
        Tempo em {place}
      </h1>

      <SectionLabel>Agora em {v.cidade}</SectionLabel>
      <AgoraCard v={v} />
      <RainAlert v={v} />

      <ProximasHoras v={v} />

      <ResumoZe v={v} />

      <H2>O veredito do Zé pra cada coisa</H2>
      <VerdictGrid cards={v.cards} />

      <H2>Pergunta o que quiser</H2>
      <FreeQuestionBox city={city} />

      <H2>Sobre o tempo em {city.n} hoje</H2>
      <p style={{ font: '500 15px/1.7 var(--jakarta)', color: '#3a4658' }}>{v.seoIntro}</p>

      <AstroGrid v={v} />
      <SevenDay v={v} />
      <Faq v={v} />

      <p style={{ font: '500 12px var(--jakarta)', color: 'var(--muted-2)', marginTop: 24 }}>
        Fonte dos dados: {v.source} · atualizado {new Date(v.fetchedAt).toLocaleString('pt-BR')}.
      </p>
    </main>
  );
}
