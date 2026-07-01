import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Termos de Uso — BrasilTempo',
  description:
    'As regras de uso do BrasilTempo: a previsão é uma estimativa, fornecida no estado em que se encontra, sem garantias. Leia antes de planejar.',
  alternates: { canonical: '/termos' },
};

const ATUALIZADO = '1 de julho de 2026';

export default function TermosPage() {
  return (
    <main className="container">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Início', path: '/' },
            { name: 'Termos de Uso', path: '/termos' },
          ]),
          webPageSchema({
            name: 'Termos de Uso',
            description: 'As regras de uso do BrasilTempo: a previsão é uma estimativa, sem garantias.',
            path: '/termos',
          }),
        ]}
      />
      <h1 style={{ font: '800 32px/1.15 var(--jakarta)', color: 'var(--ink)', letterSpacing: '-.025em', margin: '0 0 6px' }}>
        Termos de Uso
      </h1>
      <div style={{ font: '600 13px var(--jakarta)', color: 'var(--muted)', marginBottom: 22 }}>
        Última atualização: {ATUALIZADO}
      </div>

      <div className="article">
        <p className="lead">
          Estes Termos de Uso regem o acesso e a utilização do site BrasilTempo
          (brasiltempo.com.br). Ao acessar ou usar o serviço, você declara que leu, entendeu e
          concorda com estes termos e com a <Link href="/privacidade">Política de Privacidade</Link>.
          Se não concordar, não utilize o site.
        </p>

        <h2>1. O serviço</h2>
        <p>
          O BrasilTempo oferece, de forma gratuita, previsões e interpretações (&quot;vereditos&quot;)
          sobre o tempo, geradas a partir de dados meteorológicos e de critérios transparentes, com o
          objetivo de auxiliar no dia a dia. O serviço pode ser alterado, suspenso ou descontinuado,
          no todo ou em parte, a qualquer momento e sem aviso prévio.
        </p>

        <h2>2. Previsão é estimativa, não promessa</h2>
        <p>
          A meteorologia trabalha com probabilidades e modelos sujeitos a incerteza. As informações
          são fornecidas <strong>&quot;no estado em que se encontram&quot; e &quot;conforme
          disponíveis&quot;</strong>, sem qualquer garantia, expressa ou implícita, de exatidão,
          atualidade, continuidade, disponibilidade ou adequação a uma finalidade específica.
        </p>
        <p>
          Para situações críticas — atividades de risco, agricultura, aviação, navegação, eventos
          climáticos severos e emergências — consulte sempre fontes oficiais, como o INMET, a Marinha
          do Brasil e a Defesa Civil.
        </p>

        <h2>3. Limitação de responsabilidade</h2>
        <p>
          Na máxima extensão permitida pela legislação aplicável, o BrasilTempo e seus responsáveis
          não se responsabilizam por perdas ou danos diretos, indiretos, incidentais ou
          consequentes decorrentes do uso, da impossibilidade de uso ou da confiança nas informações
          do site — do churrasco cancelado ao compromisso remarcado. As decisões tomadas com base no
          conteúdo são de responsabilidade exclusiva do usuário.
        </p>

        <h2>4. Fonte dos dados</h2>
        <p>
          Os dados meteorológicos de base provêm do <strong>NOAA GFS</strong>, de domínio público,
          acessado por serviços públicos. Derivações e estimativas (como índice UV, probabilidade de
          chuva e sensação térmica) são calculadas por nós e descritas no próprio site. O BrasilTempo
          não é afiliado ao NOAA nem a órgãos governamentais.
        </p>

        <h2>5. Uso aceitável</h2>
        <p>Ao usar o site, você concorda em não:</p>
        <ul>
          <li>sobrecarregar, invadir, testar vulnerabilidades ou prejudicar a operação do serviço;</li>
          <li>
            coletar dados de forma automatizada (<em>scraping</em>) de maneira abusiva ou em
            violação a estes termos;
          </li>
          <li>reproduzir, revender ou explorar o conteúdo como se fosse seu, sem autorização;</li>
          <li>utilizar o serviço para fins ilícitos ou em desacordo com a legislação aplicável.</li>
        </ul>

        <h2>6. Propriedade intelectual</h2>
        <p>
          A marca BrasilTempo, o logotipo, os textos, o design, o código e a forma de apresentação
          das informações são protegidos e pertencem ao BrasilTempo ou a seus licenciadores. Os dados
          meteorológicos de base são de domínio público; a curadoria, os critérios e a apresentação,
          não. É vedado o uso não autorizado desses elementos.
        </p>

        <h2>7. Publicidade e links de terceiros</h2>
        <p>
          O site pode exibir anúncios e conter links para sites de terceiros, sobre os quais não
          temos controle. Não endossamos e não nos responsabilizamos por conteúdos, produtos,
          serviços ou práticas de privacidade desses terceiros. O uso de cookies para publicidade e
          medição está descrito na <Link href="/cookies">Política de Cookies</Link>.
        </p>

        <h2>8. Privacidade</h2>
        <p>
          O tratamento de dados pessoais é regido pela{' '}
          <Link href="/privacidade">Política de Privacidade</Link> e pela{' '}
          <Link href="/cookies">Política de Cookies</Link>, que integram estes termos.
        </p>

        <h2>9. Alterações</h2>
        <p>
          Podemos atualizar estes termos a qualquer momento. A data de &quot;última atualização&quot;
          no topo indica a versão vigente, e o uso continuado do site após a publicação implica
          concordância com a nova versão.
        </p>

        <h2>10. Lei aplicável e foro</h2>
        <p>
          Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro
          do domicílio do usuário para dirimir eventuais controvérsias, conforme o Código de Defesa
          do Consumidor, quando aplicável.
        </p>

        <h2>11. Contato</h2>
        <p>
          Dúvidas sobre estes termos podem ser enviadas para{' '}
          <a href="mailto:contato@brasiltempo.com.br">contato@brasiltempo.com.br</a>.
        </p>
      </div>
    </main>
  );
}
