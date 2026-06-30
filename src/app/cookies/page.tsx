import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Política de Cookies — BrasilTempo',
  description:
    'O que são cookies, quais o BrasilTempo usa (principalmente os de publicidade) e como você pode gerenciá-los ou desativá-los.',
  alternates: { canonical: '/cookies' },
};

const ATUALIZADO = '28 de junho de 2026';

export default function CookiesPage() {
  return (
    <main className="container">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Início', path: '/' },
            { name: 'Política de Cookies', path: '/cookies' },
          ]),
          webPageSchema({
            name: 'Política de Cookies',
            description: 'O que são cookies, quais o BrasilTempo usa e como gerenciá-los.',
            path: '/cookies',
          }),
        ]}
      />
      <h1 style={{ font: '800 32px/1.15 var(--jakarta)', color: 'var(--ink)', letterSpacing: '-.025em', margin: '0 0 6px' }}>
        Política de Cookies
      </h1>
      <div style={{ font: '600 13px var(--jakarta)', color: 'var(--muted)', marginBottom: 22 }}>
        Última atualização: {ATUALIZADO}
      </div>

      <div className="article">
        <p className="lead">
          Cookies são pequenos arquivos que um site guarda no seu navegador. O BrasilTempo usa pouca
          coisa — e esta página explica o quê, pra quê, e como você manda nisso.
        </p>

        <h2>Tipos de cookies que podem ser usados</h2>
        <ul>
          <li>
            <strong>Essenciais.</strong> Necessários para o funcionamento básico do site. Não
            guardam informação que te identifique.
          </li>
          <li>
            <strong>Preferências.</strong> Podem lembrar escolhas suas (como a última cidade
            consultada) para melhorar a experiência.
          </li>
          <li>
            <strong>Publicidade (terceiros).</strong> Se exibirmos anúncios via Google AdSense, o
            Google pode usar cookies para mostrar e medir anúncios, inclusive personalizados com base
            na sua navegação. Esses cookies são definidos pelo Google, não por nós.
          </li>
          <li>
            <strong>Medição de audiência.</strong> Podemos usar ferramentas de estatística para
            entender, de forma agregada, como o site é usado.
          </li>
        </ul>

        <h2>Cookies de publicidade do Google</h2>
        <p>
          O Google, como fornecedor terceiro, utiliza cookies para veicular anúncios. O cookie de
          anúncios do Google permite a ele e a seus parceiros exibir anúncios com base nas visitas a
          este e a outros sites. Você pode desativar a publicidade personalizada nas{' '}
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
            Configurações de anúncios do Google
          </a>
          .
        </p>

        <h2>Como gerenciar cookies</h2>
        <p>
          Você controla os cookies pelo seu navegador: dá pra bloquear, apagar ou ser avisado antes
          de cada um. Os caminhos ficam em Chrome, Firefox, Safari e Edge nas configurações de
          privacidade. Bloquear cookies de terceiros não impede você de usar o BrasilTempo — só pode
          deixar os anúncios menos relevantes.
        </p>

        <h2>Mais informações</h2>
        <p>
          O uso de cookies se conecta ao tratamento de dados descrito na nossa{' '}
          <Link href="/privacidade">Política de Privacidade</Link>. Dúvidas? Escreva pra{' '}
          <a href="mailto:contato@brasiltempo.com.br">contato@brasiltempo.com.br</a>.
        </p>

        <blockquote>
          Este documento é um ponto de partida informativo e não substitui aconselhamento jurídico.
        </blockquote>
      </div>
    </main>
  );
}
