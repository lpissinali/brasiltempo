import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Política de Cookies — BrasilTempo',
  description:
    'O que são cookies, quais o BrasilTempo usa (principalmente os de publicidade) e como você pode gerenciá-los ou desativá-los.',
  alternates: { canonical: '/cookies' },
};

const ATUALIZADO = '1 de julho de 2026';

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
          Esta Política de Cookies explica o que são cookies, quais tipos o BrasilTempo utiliza, com
          quais finalidades, e como você pode controlá-los. Ela complementa a nossa{' '}
          <Link href="/privacidade">Política de Privacidade</Link> e deve ser lida em conjunto com
          ela.
        </p>

        <h2>1. O que são cookies</h2>
        <p>
          Cookies são pequenos arquivos de texto armazenados no seu navegador quando você visita um
          site. Servem para lembrar preferências, manter o funcionamento das páginas e medir
          audiência. Tecnologias semelhantes — como <em>pixels</em>, <em>web beacons</em> e
          identificadores locais (<em>localStorage</em>) — cumprem funções parecidas e também estão
          cobertas por esta política.
        </p>

        <h2>2. Tipos de cookies que utilizamos</h2>
        <ul>
          <li>
            <strong>Essenciais.</strong> Necessários para o funcionamento e a segurança do site. Sem
            eles, algumas partes podem não funcionar. Não dependem de consentimento.
          </li>
          <li>
            <strong>De preferências.</strong> Lembram escolhas suas (por exemplo, a última cidade
            consultada) para melhorar a experiência.
          </li>
          <li>
            <strong>De medição de audiência (analíticos).</strong> Por meio do Google Analytics,
            ajudam a entender, de forma agregada e estatística, como o site é utilizado.
          </li>
          <li>
            <strong>De publicidade (terceiros).</strong> Por meio do Google AdSense, permitem exibir,
            limitar a frequência e medir anúncios, inclusive personalizados conforme sua navegação.
            Esses cookies são definidos pelo Google e por seus parceiros, não por nós.
          </li>
        </ul>

        <h2>3. Cookies de terceiros: Google</h2>
        <p>
          O Google, como fornecedor terceiro, utiliza cookies para veicular e medir anúncios (Google
          AdSense) e para gerar estatísticas de uso (Google Analytics). O cookie de anúncios do
          Google permite a ele e a seus parceiros exibir anúncios com base nas suas visitas a este e
          a outros sites. O tratamento desses dados pelo Google é regido pelas políticas do próprio
          Google. Saiba mais em{' '}
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
            &quot;Como o Google usa informações de sites que usam seus serviços&quot;
          </a>
          .
        </p>

        <h2>4. Base legal e consentimento</h2>
        <p>
          Cookies essenciais são utilizados com base no legítimo interesse de manter o serviço
          funcionando. Cookies de preferências, medição e publicidade dependem, quando aplicável, do
          seu consentimento ou do legítimo interesse, e você pode gerenciá-los a qualquer momento
          pelas opções abaixo.
        </p>

        <h2>5. Como gerenciar e desativar</h2>
        <ul>
          <li>
            <strong>Banner de consentimento:</strong> na primeira visita, você escolhe aceitar ou
            recusar os cookies não essenciais (medição e publicidade). Sua escolha fica salva neste
            navegador; para revê-la, limpe os dados do site e recarregue a página.
          </li>
          <li>
            <strong>No navegador:</strong> Chrome, Firefox, Safari e Edge permitem bloquear, apagar
            ou ser avisado sobre cookies nas configurações de privacidade. Você também pode usar o
            modo de navegação anônima.
          </li>
          <li>
            <strong>Anúncios personalizados do Google:</strong> ajuste em{' '}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
              Configurações de anúncios do Google
            </a>
            .
          </li>
          <li>
            <strong>Opt-out setorial:</strong> ferramentas como{' '}
            <a href="https://www.youronlinechoices.com/" target="_blank" rel="noopener noreferrer">
              Your Online Choices
            </a>{' '}
            permitem desativar publicidade comportamental de diversas empresas.
          </li>
        </ul>
        <p>
          Bloquear cookies de terceiros não impede o uso do BrasilTempo — apenas pode deixar os
          anúncios menos relevantes e reduzir algumas estatísticas.
        </p>

        <h2>6. Alterações e contato</h2>
        <p>
          Esta política pode ser atualizada periodicamente; a data no topo indica a versão vigente.
          Dúvidas sobre cookies podem ser enviadas para{' '}
          <a href="mailto:contato@brasiltempo.com.br">contato@brasiltempo.com.br</a>.
        </p>
      </div>
    </main>
  );
}
