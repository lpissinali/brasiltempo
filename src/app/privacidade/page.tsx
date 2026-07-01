import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Política de Privacidade — BrasilTempo',
  description:
    'Como o BrasilTempo trata seus dados: o que coletamos (quase nada), por que, e seus direitos sob a LGPD.',
  alternates: { canonical: '/privacidade' },
};

const ATUALIZADO = '1 de julho de 2026';

export default function PrivacidadePage() {
  return (
    <main className="container">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Início', path: '/' },
            { name: 'Política de Privacidade', path: '/privacidade' },
          ]),
          webPageSchema({
            name: 'Política de Privacidade',
            description: 'Como o BrasilTempo trata seus dados e seus direitos sob a LGPD.',
            path: '/privacidade',
          }),
        ]}
      />
      <h1 style={{ font: '800 32px/1.15 var(--jakarta)', color: 'var(--ink)', letterSpacing: '-.025em', margin: '0 0 6px' }}>
        Política de Privacidade
      </h1>
      <div style={{ font: '600 13px var(--jakarta)', color: 'var(--muted)', marginBottom: 22 }}>
        Última atualização: {ATUALIZADO}
      </div>

      <div className="article">
        <p className="lead">
          Esta Política de Privacidade descreve como o BrasilTempo coleta, utiliza, compartilha e
          protege dados pessoais, em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de
          Dados Pessoais — LGPD) e o Marco Civil da Internet (Lei nº 12.965/2014). Ao utilizar o
          site, você declara estar ciente das práticas aqui descritas.
        </p>

        <h2>1. Controlador e contato</h2>
        <p>
          O BrasilTempo (&quot;BrasilTempo&quot;, &quot;nós&quot;), disponível em{' '}
          <strong>brasiltempo.com.br</strong>, é o controlador dos dados pessoais tratados neste
          site. Para exercer seus direitos, tirar dúvidas ou falar com nosso encarregado pela
          proteção de dados (DPO), escreva para{' '}
          <a href="mailto:contato@brasiltempo.com.br">contato@brasiltempo.com.br</a>.
        </p>

        <h2>2. Dados que tratamos</h2>
        <p>
          O BrasilTempo foi projetado para funcionar com o mínimo de dados pessoais. Não exigimos
          cadastro, login ou senha, e não solicitamos nome, CPF, telefone ou e-mail para uso do
          site. Tratamos as seguintes categorias:
        </p>
        <ul>
          <li>
            <strong>Dados de navegação e do dispositivo.</strong> Coletados automaticamente, como
            endereço IP, tipo e versão de navegador, sistema operacional, páginas acessadas,
            data/hora e páginas de referência. Usados para segurança, funcionamento e estatísticas.
          </li>
          <li>
            <strong>Localização aproximada — mediante ação sua.</strong> Ao acionar o botão de
            &quot;minha localização&quot;, o navegador solicita sua permissão e envia coordenadas
            geográficas para buscarmos a previsão do local. Essa posição é usada no momento da
            consulta e <strong>não é armazenada de forma associada a você</strong>.
          </li>
          <li>
            <strong>Consultas na caixa de perguntas.</strong> O texto digitado é processado para
            gerar a resposta e pode ser mantido em cache temporário (por cidade e por dia) para
            acelerar perguntas repetidas. Recomendamos não inserir dados pessoais ou sensíveis nesse
            campo.
          </li>
          <li>
            <strong>Cookies e identificadores.</strong> Utilizados por nós e por parceiros para
            medição de audiência e publicidade, conforme a{' '}
            <Link href="/cookies">Política de Cookies</Link>.
          </li>
        </ul>
        <p>Não coletamos intencionalmente dados pessoais sensíveis nem dados de crianças (ver item 9).</p>

        <h2>3. Finalidades e bases legais</h2>
        <p>
          Tratamos dados apenas para finalidades legítimas e específicas, com as seguintes bases
          legais previstas no art. 7º da LGPD:
        </p>
        <ul>
          <li>
            <strong>Prestar e manter o serviço</strong> (exibir a previsão, responder perguntas):
            execução de contrato/serviço e legítimo interesse.
          </li>
          <li>
            <strong>Segurança, prevenção a fraudes e estabilidade</strong>: legítimo interesse e
            cumprimento de obrigação legal (guarda de registros de acesso, Marco Civil).
          </li>
          <li>
            <strong>Localização por geolocalização</strong>: consentimento do titular, concedido no
            navegador e revogável a qualquer momento.
          </li>
          <li>
            <strong>Medição de audiência e publicidade</strong>: consentimento e/ou legítimo
            interesse, conforme a Política de Cookies e suas escolhas.
          </li>
        </ul>

        <h2>4. Publicidade e medição de audiência</h2>
        <p>
          O BrasilTempo pode exibir anúncios por meio do Google AdSense e medir audiência com o
          Google Analytics. Esses serviços, como terceiros, utilizam cookies e identificadores para
          exibir, limitar e medir anúncios, inclusive personalizados, e para gerar estatísticas de
          uso. Você pode gerenciar a personalização de anúncios em{' '}
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
            Configurações de anúncios do Google
          </a>{' '}
          e controlar cookies conforme a <Link href="/cookies">Política de Cookies</Link>.
        </p>

        <h2>5. Compartilhamento de dados</h2>
        <p>
          Não vendemos dados pessoais. Compartilhamos dados apenas com operadores que viabilizam o
          serviço, sob instruções e para as finalidades acima, entre eles:
        </p>
        <ul>
          <li><strong>Infraestrutura e hospedagem:</strong> Google Firebase / Google Cloud.</li>
          <li><strong>Medição e publicidade:</strong> Google Analytics e Google AdSense.</li>
          <li>
            <strong>Geocodificação:</strong> provedores que convertem nomes de cidades em
            coordenadas.
          </li>
          <li>
            <strong>Autoridades:</strong> quando exigido por lei, ordem judicial ou requisição de
            autoridade competente.
          </li>
        </ul>
        <p>
          Os dados meteorológicos exibidos provêm do <strong>NOAA GFS</strong>, de domínio público, e
          não constituem dados pessoais.
        </p>

        <h2>6. Transferência internacional</h2>
        <p>
          Alguns operadores (por exemplo, Google) podem processar dados em servidores localizados
          fora do Brasil. Nesses casos, a transferência é realizada com base em garantias adequadas e
          nas hipóteses do art. 33 da LGPD, buscando padrões de proteção compatíveis com a
          legislação brasileira.
        </p>

        <h2>7. Retenção e segurança</h2>
        <p>
          Mantemos os dados apenas pelo tempo necessário às finalidades informadas ou ao cumprimento
          de obrigações legais — por exemplo, registros de acesso pelo prazo previsto no Marco Civil
          da Internet. Caches de consultas são temporários e rotativos. Adotamos medidas técnicas e
          organizacionais razoáveis para proteger os dados contra acesso não autorizado, perda ou
          alteração; nenhum sistema, contudo, é totalmente imune a incidentes.
        </p>

        <h2>8. Seus direitos como titular</h2>
        <p>
          Nos termos do art. 18 da LGPD, você pode, a qualquer momento e gratuitamente, solicitar:
        </p>
        <ul>
          <li>confirmação da existência de tratamento e acesso aos dados;</li>
          <li>correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;</li>
          <li>portabilidade e informação sobre compartilhamento com terceiros;</li>
          <li>revogação do consentimento e informação sobre as consequências da recusa.</li>
        </ul>
        <p>
          Para exercer esses direitos, escreva para{' '}
          <a href="mailto:contato@brasiltempo.com.br">contato@brasiltempo.com.br</a>. Como
          tratamos pouquíssimos dados identificáveis, em muitos casos não haverá informação
          associada a você. Você também pode apresentar reclamação à Autoridade Nacional de Proteção
          de Dados (ANPD).
        </p>

        <h2>9. Crianças e adolescentes</h2>
        <p>
          O BrasilTempo não é direcionado a menores de 18 anos e não coleta intencionalmente dados de
          crianças e adolescentes. Se identificarmos tratamento indevido desses dados, adotaremos
          medidas para eliminá-los.
        </p>

        <h2>10. Alterações desta política</h2>
        <p>
          Esta política pode ser atualizada para refletir mudanças no serviço ou na legislação.
          Alterações relevantes serão sinalizadas pela data de &quot;última atualização&quot; no topo
          desta página. O uso continuado do site após a publicação implica ciência da versão vigente.
        </p>
      </div>
    </main>
  );
}
