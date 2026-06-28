import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidade — BrasilTempo',
  description:
    'Como o BrasilTempo trata seus dados: o que coletamos (quase nada), por que, e seus direitos sob a LGPD.',
  alternates: { canonical: '/privacidade' },
};

const ATUALIZADO = '28 de junho de 2026';

export default function PrivacidadePage() {
  return (
    <main className="container">
      <Link href="/" style={{ font: '600 13px var(--jakarta)', color: 'var(--blue)' }}>← Voltar pro início</Link>
      <h1 style={{ font: '800 32px/1.15 var(--jakarta)', color: 'var(--ink)', letterSpacing: '-.025em', margin: '14px 0 6px' }}>
        Política de Privacidade
      </h1>
      <div style={{ font: '600 13px var(--jakarta)', color: 'var(--muted)', marginBottom: 22 }}>
        Última atualização: {ATUALIZADO}
      </div>

      <div className="article">
        <p className="lead">
          O BrasilTempo é um site de previsão do tempo. A gente quer te dar o veredito do dia, não a
          sua vida. Por isso coletamos o mínimo possível — e esta página explica exatamente o quê.
        </p>

        <h2>Quem somos</h2>
        <p>
          BrasilTempo (&quot;nós&quot;), acessível em <strong>brasiltempo.com.br</strong>. Para
          qualquer questão de privacidade, fale com a gente em{' '}
          <a href="mailto:contato@brasiltempo.com.br">contato@brasiltempo.com.br</a>.
        </p>

        <h2>O que coletamos</h2>
        <ul>
          <li>
            <strong>Nada de conta.</strong> Não há cadastro, login ou senha. Não pedimos nome, CPF
            nem telefone.
          </li>
          <li>
            <strong>Localização — só quando você pede.</strong> Ao clicar no botão de
            &quot;minha localização&quot;, seu navegador envia coordenadas aproximadas para
            buscarmos a previsão do seu local. Usamos na hora e <strong>não armazenamos</strong> essa
            posição.
          </li>
          <li>
            <strong>Perguntas na caixa de perguntas.</strong> O texto que você digita é processado para
            gerar a resposta e pode ficar em cache temporário (por cidade e dia) para acelerar
            perguntas repetidas. Não associamos perguntas à sua identidade.
          </li>
          <li>
            <strong>Dados técnicos.</strong> Como qualquer site, nossos servidores registram
            informações padrão de acesso (endereço IP, tipo de navegador, páginas visitadas) para
            segurança e estatísticas agregadas.
          </li>
        </ul>

        <h2>Cookies e publicidade</h2>
        <p>
          Podemos exibir anúncios via Google AdSense e usar ferramentas de medição de audiência.
          Esses serviços utilizam cookies e tecnologias semelhantes para funcionar e personalizar
          anúncios. Os detalhes — e como desativar — estão na nossa{' '}
          <Link href="/cookies">Política de Cookies</Link>.
        </p>

        <h2>Com quem compartilhamos</h2>
        <p>
          Não vendemos seus dados. Compartilhamos apenas o necessário com provedores que operam o
          serviço, como a infraestrutura de hospedagem (Google Firebase) e os serviços de
          geocodificação que transformam o nome da cidade em coordenadas. Os dados meteorológicos
          vêm do <strong>NOAA GFS</strong>, de domínio público.
        </p>

        <h2>Seus direitos (LGPD)</h2>
        <p>
          Pela Lei Geral de Proteção de Dados, você pode solicitar acesso, correção ou exclusão de
          eventuais dados pessoais, além de informações sobre o tratamento. Como praticamente não
          guardamos dados pessoais, na maioria dos casos não há o que excluir — mas é só escrever pra{' '}
          <a href="mailto:contato@brasiltempo.com.br">contato@brasiltempo.com.br</a> que a gente
          responde.
        </p>

        <h2>Alterações</h2>
        <p>
          Esta política pode ser atualizada conforme o serviço evolui. Mudanças relevantes serão
          refletidas na data de &quot;última atualização&quot; no topo desta página.
        </p>

        <blockquote>
          Este documento é um ponto de partida informativo e não substitui aconselhamento jurídico.
          Recomenda-se revisão por um profissional antes do uso comercial.
        </blockquote>
      </div>
    </main>
  );
}
