import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Termos de Uso — BrasilTempo',
  description:
    'As regras de uso do BrasilTempo: a previsão é uma estimativa, fornecida no estado em que se encontra, sem garantias. Leia antes de planejar.',
  alternates: { canonical: '/termos' },
};

const ATUALIZADO = '28 de junho de 2026';

export default function TermosPage() {
  return (
    <main className="container">
      <Link href="/" style={{ font: '600 13px var(--jakarta)', color: 'var(--blue)' }}>← Voltar pro início</Link>
      <h1 style={{ font: '800 32px/1.15 var(--jakarta)', color: 'var(--ink)', letterSpacing: '-.025em', margin: '14px 0 6px' }}>
        Termos de Uso
      </h1>
      <div style={{ font: '600 13px var(--jakarta)', color: 'var(--muted)', marginBottom: 22 }}>
        Última atualização: {ATUALIZADO}
      </div>

      <div className="article">
        <p className="lead">
          Ao usar o BrasilTempo você concorda com estes termos. São curtos e diretos — do nosso jeito.
        </p>

        <h2>O serviço</h2>
        <p>
          O BrasilTempo oferece previsões e vereditos sobre o tempo de forma gratuita. As respostas
          são geradas a partir de dados meteorológicos e de critérios transparentes, com o
          objetivo de ajudar no seu dia a dia.
        </p>

        <h2>Previsão é estimativa, não promessa</h2>
        <p>
          A meteorologia trabalha com probabilidades. As informações são fornecidas{' '}
          <strong>&quot;no estado em que se encontram&quot;</strong>, sem garantia de exatidão,
          continuidade ou adequação a um fim específico. Não nos responsabilizamos por decisões
          tomadas com base nas previsões — do churrasco cancelado ao guarda-chuva esquecido. Para
          situações críticas (atividades de risco, agricultura, navegação, emergências), consulte
          fontes oficiais como o INMET e a Defesa Civil.
        </p>

        <h2>Fonte dos dados</h2>
        <p>
          Os dados meteorológicos vêm do <strong>NOAA GFS</strong>, de domínio público, acessado via
          serviços públicos. Derivações e estimativas (como índice UV e probabilidade de chuva) são
          calculadas por nós e descritas no próprio site.
        </p>

        <h2>Uso aceitável</h2>
        <ul>
          <li>Não tente sobrecarregar, invadir ou prejudicar o funcionamento do serviço.</li>
          <li>Não raspe (scrape) o site de forma abusiva nem revenda o conteúdo como se fosse seu.</li>
          <li>Respeite a legislação aplicável ao usar o BrasilTempo.</li>
        </ul>

        <h2>Propriedade intelectual</h2>
        <p>
          A marca BrasilTempo, os textos e o design são nossos. Os dados meteorológicos de base são
          de domínio público; a forma como os apresentamos, não.
        </p>

        <h2>Privacidade</h2>
        <p>
          O tratamento de dados está descrito na{' '}
          <Link href="/privacidade">Política de Privacidade</Link> e na{' '}
          <Link href="/cookies">Política de Cookies</Link>.
        </p>

        <h2>Alterações e contato</h2>
        <p>
          Podemos atualizar estes termos a qualquer momento; a data no topo indica a versão vigente.
          Fale com a gente em{' '}
          <a href="mailto:contato@brasiltempo.com.br">contato@brasiltempo.com.br</a>.
        </p>

        <blockquote>
          Este documento é um ponto de partida informativo e não substitui aconselhamento jurídico.
        </blockquote>
      </div>
    </main>
  );
}
