import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import { Header } from '@/components/Header';
import { Logo, Wordmark } from '@/components/Logo';
import { Analytics } from '@/components/Analytics';
import { POPULAR } from '@/lib/cities';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const DESC =
  'BrasilTempo — previsão do tempo brasileira com personalidade. Responde perguntas da vida real: vai chover? rola praia? precisa de casaco? Tudo ancorado em dados reais (NOAA GFS).';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'BrasilTempo — vai dar? previsão do tempo com personalidade',
  description: DESC,
  applicationName: 'BrasilTempo',
  authors: [{ name: 'BrasilTempo' }],
  creator: 'BrasilTempo',
  publisher: 'BrasilTempo',
  keywords: [
    'previsão do tempo',
    'tempo agora',
    'vai chover',
    'clima',
    'previsão do tempo Brasil',
    'temperatura',
    'índice UV',
    'fim de semana',
  ],
  formatDetection: { telephone: false, address: false, email: false },
  other: {
    // AdSense site verification.
    'google-adsense-account': 'ca-pub-4831931651277615',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'BrasilTempo',
    url: '/',
    title: 'BrasilTempo — o oráculo do tempo que fala a sua língua',
    description:
      'Pergunta da vida real, resposta direta — sempre ancorada em dado de verdade. O BrasilTempo te responde.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'BrasilTempo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BrasilTempo — previsão do tempo com personalidade',
    description:
      'Pergunta da vida real, resposta direta — sempre ancorada em dado de verdade.',
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2E7BD6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Header />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}

const INSTITUCIONAL = [
  { label: 'Blog', href: '/blog' },
  { label: 'Política de Privacidade', href: '/privacidade' },
  { label: 'Política de Cookies', href: '/cookies' },
  { label: 'Termos de Uso', href: '/termos' },
];

function Footer() {
  const col: React.CSSProperties = { font: '700 12px var(--jakarta)', letterSpacing: '.06em', textTransform: 'uppercase', color: '#7a8aa0', marginBottom: 11 };
  const item: React.CSSProperties = { font: '500 13px/1.9 var(--jakarta)', color: '#9fb2c8', display: 'block' };
  return (
    <footer style={{ background: 'var(--ink)', color: '#9fb2c8', marginTop: 40 }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 18px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 24 }}>
          <div>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Logo size={28} />
              <Wordmark light size={17} />
            </Link>
            <p style={{ font: '500 13px/1.6 var(--jakarta)', color: '#9fb2c8', marginTop: 12, maxWidth: 240 }}>
              O oráculo do tempo que fala a sua língua. Pergunta da vida real, resposta direta — sempre ancorada em dado de verdade.
            </p>
          </div>
          <div>
            <div style={col}>Cidades populares</div>
            {POPULAR.map((c) => (
              <Link key={c.slug} href={`/cidade/${c.slug}`} style={item}>{c.n} · {c.uf}</Link>
            ))}
          </div>
          <div>
            <div style={col}>Institucional</div>
            {INSTITUCIONAL.map((p) => (
              <Link key={p.href} href={p.href} style={item}>{p.label}</Link>
            ))}
          </div>
          <div>
            <div style={col}>Como funciona</div>
            <span style={{ font: '500 13px/1.6 var(--jakarta)', color: '#9fb2c8' }}>
              O BrasilTempo lê os dados meteorológicos da NOAA (GFS) e traduz em veredito direto. Os critérios são transparentes e ajustáveis — nada de caixa-preta.
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
          <span>Dados: NOAA GFS · previsão é previsão, a gente chuta com carinho.</span>
        </div>
      </div>
    </footer>
  );
}
