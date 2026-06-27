import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Header } from '@/components/Header';
import { Logo, Wordmark } from '@/components/Logo';
import { CITIES } from '@/lib/cities';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'BrasilTempo — vai dar? previsão do tempo com personalidade',
  description:
    'BrasilTempo — previsão do tempo brasileira com personalidade. Responde perguntas da vida real: vai chover? rola praia? precisa de casaco? Tudo ancorado em dados reais (NOAA GFS).',
  openGraph: {
    title: 'BrasilTempo — o oráculo do tempo que fala a sua língua',
    description:
      'Pergunta da vida real, resposta direta — sempre ancorada em dado de verdade. O Zé do Tempo te responde.',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}

const PERGUNTAS = [
  { label: 'Vai chover amanhã?', href: '/' },
  { label: 'Praia no fds', href: '/' },
  { label: 'Casaco hoje', href: '/' },
  { label: 'Churrasco fds', href: '/' },
  { label: 'Estender a roupa', href: '/' },
  { label: 'Protetor hoje', href: '/' },
];

function Footer() {
  const col: React.CSSProperties = { font: '700 12px var(--jakarta)', letterSpacing: '.06em', textTransform: 'uppercase', color: '#7a8aa0', marginBottom: 11 };
  const item: React.CSSProperties = { font: '500 13px/1.9 var(--jakarta)', color: '#9fb2c8', display: 'block' };
  return (
    <footer style={{ background: 'var(--ink)', color: '#9fb2c8', marginTop: 40 }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 18px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 24 }}>
          <div>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Logo size={28} />
              <Wordmark light size={17} />
            </Link>
            <p style={{ font: '500 13px/1.6 var(--jakarta)', color: '#9fb2c8', marginTop: 12, maxWidth: 220 }}>
              O oráculo do tempo que fala a sua língua. Pergunta da vida real, resposta direta — sempre ancorada em dado de verdade.
            </p>
          </div>
          <div>
            <div style={col}>Perguntas</div>
            {PERGUNTAS.map((p) => (
              <Link key={p.label} href={p.href} style={item}>{p.label}</Link>
            ))}
          </div>
          <div>
            <div style={col}>Cidades</div>
            {CITIES.map((c) => (
              <Link key={c.slug} href={`/cidade/${c.slug}`} style={item}>{c.n} · {c.uf}</Link>
            ))}
          </div>
          <div>
            <div style={col}>Como funciona</div>
            <span style={{ font: '500 13px/1.6 var(--jakarta)', color: '#9fb2c8' }}>
              O Zé lê os dados meteorológicos da NOAA (GFS) e traduz em veredito direto. Os critérios são transparentes e ajustáveis — nada de caixa-preta.
            </span>
          </div>
        </div>
        <div
          style={{
            borderTop: '1px solid #2a3748',
            marginTop: 28,
            paddingTop: 18,
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            font: '500 12px var(--jakarta)',
          }}
        >
          <span>© 2026 BrasilTempo · feito no Brasil 🇧🇷</span>
          <span>Dados: NOAA GFS · previsão é previsão, o Zé chuta com carinho.</span>
        </div>
      </div>
    </footer>
  );
}
