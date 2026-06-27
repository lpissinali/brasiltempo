import { DEFAULT_CITY } from '@/lib/cities';
import { getForecast } from '@/lib/gfs';
import { buildView } from '@/lib/verdicts';
import { VerdictGrid } from '@/components/VerdictCard';
import { FreeQuestionBox } from '@/components/FreeQuestionBox';
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

export default async function HomePage() {
  const forecast = await getForecast(DEFAULT_CITY);
  const v = buildView(DEFAULT_CITY, forecast);

  return (
    <main className="container">
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

      <p style={{ font: '500 13px/1.6 var(--jakarta)', color: 'var(--muted-2)', marginTop: 28 }}>
        O BrasilTempo é a previsão do tempo de {v.cidade} que responde o que você realmente quer saber:
        vai chover? rola praia? precisa de casaco? Em vez de um monte de número solto, o Zé olha os dados
        ao vivo e te dá o veredito na lata, com aquele bom humor de quem manja do céu. Fonte: {v.source}
        (domínio público).
      </p>
    </main>
  );
}
