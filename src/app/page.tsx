import Link from 'next/link';
import { DEFAULT_CITY, POPULAR } from '@/lib/cities';
import { POSTS } from '@/lib/posts';
import { getForecast } from '@/lib/gfs';
import { buildView } from '@/lib/verdicts';
import { getZePhrases } from '@/lib/phrases';
import type { Metadata } from 'next';
import { VerdictGrid } from '@/components/VerdictCard';
import { FreeQuestionBox } from '@/components/FreeQuestionBox';
import { JsonLd, websiteSchema } from '@/components/JsonLd';
import {
  NowStrip,
  SectionLabel,
  AgoraCard,
  RainAlert,
  ProximasHoras,
  AstroGrid,
  PrevisaoCompletaLink,
} from '@/components/WeatherSections';

// SSR: re-render at most every 30 min (data is cached server-side too).
export const revalidate = 1800;

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const forecast = await getForecast(DEFAULT_CITY);
  const phrases = await getZePhrases({ key: `city_${DEFAULT_CITY.slug}`, cityName: DEFAULT_CITY.n });
  const v = buildView(DEFAULT_CITY, forecast, phrases);

  return (
    <main className="container">
      <JsonLd data={websiteSchema()} />
      <NowStrip v={v} />
      <h1 style={{ font: '800 30px/1.15 var(--jakarta)', color: 'var(--ink)', letterSpacing: '-.02em', margin: '6px 0 16px' }}>
        E aí, o que você quer fazer hoje?
      </h1>

      <FreeQuestionBox city={DEFAULT_CITY} />

      <SectionLabel>Agora em {v.cidade}</SectionLabel>
      <AgoraCard v={v} />
      <RainAlert v={v} />

      <ProximasHoras v={v} />

      <SectionLabel>As perguntas da galera</SectionLabel>
      <VerdictGrid cards={v.cards} />

      <AstroGrid v={v} />

      <PrevisaoCompletaLink v={v} />

      <section className="article" style={{ marginTop: 36, maxWidth: 'none' }}>
        <h2>Previsão do tempo que responde a pergunta de verdade</h2>
        <p>
          O <strong>BrasilTempo</strong> é a previsão do tempo que fala a sua língua. Em vez de
          despejar um monte de número solto, o BrasilTempo lê os dados meteorológicos ao vivo e te dá
          o veredito na lata: <strong>vai chover amanhã?</strong> rola praia ou um rolê ao ar livre no
          fim de semana? precisa de casaco hoje? dá pra acender a churrasqueira? tem que passar
          protetor? Cada resposta vem com o dado que a sustenta — probabilidade de chuva, máxima e
          mínima, índice UV, vento — pra você decidir o dia em segundos.
        </p>
        <p>
          Tudo é ancorado em dados reais do <strong>NOAA GFS</strong>, o modelo meteorológico global de
          domínio público, atualizado várias vezes ao dia. Os critérios de cada veredito são
          transparentes e ajustáveis — nada de caixa-preta. Veja{' '}
          <Link href="/blog/como-saber-se-vai-chover">como saber se vai chover</Link>,{' '}
          <Link href="/blog/o-que-e-indice-uv">o que significa o índice UV</Link> e{' '}
          <Link href="/blog/previsao-7-dias-confiavel">se dá pra confiar na previsão de 7 dias</Link>.
        </p>

        <h2>Previsão do tempo nas principais cidades do Brasil</h2>
        <p>
          Confira a previsão completa — hoje, próximas horas e 7 dias — na sua cidade. E se a sua não
          estiver na lista, é só buscar no topo: o BrasilTempo cobre qualquer cidade do mundo.
        </p>
        <p>
          {POPULAR.map((c, i) => (
            <span key={c.slug}>
              <Link href={`/cidade/${c.slug}`}>Tempo em {c.n}</Link>
              {i < POPULAR.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </p>

        <h2>Aprenda a ler o céu sem complicar</h2>
        <p>
          No blog, o tempo explicado sem complicar:{' '}
          {POSTS.map((p, i) => (
            <span key={p.slug}>
              <Link href={`/blog/${p.slug}`}>{p.title}</Link>
              {i < POSTS.length - 1 ? ' · ' : ''}
            </span>
          ))}
          . Fonte dos dados: {v.source} (domínio público).
        </p>
      </section>
    </main>
  );
}
