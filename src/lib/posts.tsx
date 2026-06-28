import type { ReactNode } from 'react';
import Link from 'next/link';

// Blog registry. Each post is real, evergreen, genuinely useful content (not
// scaled/spun filler) — the indexable counterpart to the data pages. Metadata
// lives here alongside the body so the /blog index, the /blog/[slug] route, the
// sitemap and the Article JSON-LD all read from one source of truth.

export interface Post {
  slug: string;
  title: string;
  tag: string;
  /** Meta description + index blurb. */
  description: string;
  /** ISO date. */
  date: string;
  updated?: string;
  readingMin: number;
  /** Optional Q&A surfaced as FAQPage structured data + an on-page FAQ. */
  faqs?: { q: string; a: string }[];
  Body: () => ReactNode;
}

export const POSTS: Post[] = [
  {
    slug: 'como-o-ze-decide-se-vai-chover',
    title: 'Como o Zé decide se vai chover (sem cristal nem palpite)',
    tag: 'Bastidores',
    description:
      'Por trás do "VAI SIM", "TALVEZ" ou "NÃO" tem dado de verdade. Veja os três sinais — probabilidade, volume e umidade — e os limites exatos que o Zé usa pra cravar se vai chover.',
    date: '2026-06-10',
    readingMin: 5,
    faqs: [
      {
        q: 'O que significa a porcentagem de chuva na previsão?',
        a: 'É a probabilidade de cair pelo menos uma quantidade mensurável de chuva (0,1 mm) naquele período e local. 70% não quer dizer "chuva forte", e sim que em 7 de cada 10 situações parecidas choveu.',
      },
      {
        q: 'Qual a diferença entre probabilidade e volume de chuva?',
        a: 'Probabilidade (%) é a chance de chover; volume (mm) é quanta água deve cair. Dá pra ter 90% de chance de uma garoa de 1 mm, ou 40% de chance de um toró de 30 mm. Por isso o Zé olha os dois.',
      },
    ],
    Body: () => (
      <>
        <p className="lead">
          A graça do BrasilTempo é não te entregar um monte de número solto e te deixar adivinhando.
          O Zé olha os dados e responde direto: <strong>vai chover ou não?</strong> Mas atrás daquele
          veredito tem critério — e ele é todo transparente. Bora abrir a caixa-preta (que de preta
          não tem nada).
        </p>

        <h2>De onde vem o dado</h2>
        <p>
          Tudo começa no <strong>NOAA GFS</strong>, o modelo meteorológico global da agência dos
          Estados Unidos — o mesmo tipo de dado que alimenta meia internet de previsão do tempo. Ele
          é de domínio público, atualizado várias vezes por dia, e cobre o mundo inteiro numa grade
          de pontos. Para cada ponto, o modelo estima coisas como temperatura, umidade e{' '}
          <strong>taxa de precipitação</strong> nas próximas horas e dias.
        </p>
        <p>
          O Zé pega esses números crus e traduz pra linguagem de gente. Nada de "pratesfc 0,0003
          kg/m²/s" — isso vira "chuva fraca rondando".
        </p>

        <h2>Os três sinais que o Zé lê</h2>
        <p>Para decidir se vai chover amanhã, três coisas entram na conta:</p>
        <ul>
          <li>
            <strong>Probabilidade de chuva (%)</strong> — a chance de cair pelo menos uma quantidade
            mensurável de água. É o "quão provável".
          </li>
          <li>
            <strong>Volume previsto (mm)</strong> — quanta água deve cair no dia. É o "quão forte".
          </li>
          <li>
            <strong>Umidade do ar</strong> — ar muito úmido é combustível pra chuva; ajuda a calibrar
            os outros dois.
          </li>
        </ul>
        <p>
          Por que dois números pra chuva? Porque eles contam histórias diferentes. Uma garoa quase
          certa (90% de chance, 1 mm) não estraga seu dia do mesmo jeito que um temporal incerto
          (40% de chance, 30 mm). Olhar só a porcentagem engana.
        </p>

        <h2>Os limites exatos</h2>
        <p>Com esses sinais na mão, o veredito de "vai chover amanhã?" cai em três caixas:</p>
        <ul>
          <li>
            <strong>VAI SIM</strong> — probabilidade de 60% ou mais, <em>ou</em> volume de 8 mm ou
            mais. Pode pegar o guarda-chuva sem medo.
          </li>
          <li>
            <strong>TALVEZ</strong> — probabilidade a partir de 30%, <em>ou</em> volume a partir de
            2 mm. O céu tá em cima do muro; leva o casaquinho e reza.
          </li>
          <li>
            <strong>NÃO</strong> — abaixo disso. Pode planejar a vida ao ar livre.
          </li>
        </ul>
        <p>
          São limites simples de propósito. A meteorologia tem incerteza embutida, e fingir uma
          precisão que não existe seria desonesto. Melhor um veredito honesto e direto do que uma
          falsa exatidão.
        </p>

        <h2>Por que "amanhã" e não "hoje"?</h2>
        <p>
          A pergunta clássica é sobre <em>amanhã</em> — é quando dá tempo de mudar o plano. Mas o Zé
          também monta a <strong>janela de chuva de hoje</strong> a partir da probabilidade hora a
          hora: se há um bloco de horas com chance alta, ele te avisa "chuva por volta das 15h às
          18h". Assim você sabe não só <em>se</em>, mas <em>quando</em>.
        </p>

        <h2>Como usar isso a seu favor</h2>
        <p>
          Quando bater a dúvida, abra a{' '}
          <Link href="/">previsão do tempo da sua cidade</Link> e leia o veredito de cima. Quer
          detalhe? Os cartões mostram o dado que sustenta a resposta — probabilidade, volume, o dia
          do fim de semana. E se a sua pergunta for específica ("rola pedalar amanhã de manhã?"), é
          só perguntar pro Zé na caixa de perguntas: ele lê a previsão e responde no jeitão dele.
        </p>
        <p>
          No fim das contas, previsão é previsão — o tempo às vezes apronta. Mas com critério claro e
          dado de verdade, o palpite do Zé tem fundamento. E ele chuta com carinho.
        </p>
      </>
    ),
  },
  {
    slug: 'o-que-e-indice-uv',
    title: 'O que é índice UV e quando você deve se preocupar',
    tag: 'Saúde',
    description:
      'Do "relaxa" ao "passa agora": entenda a escala do índice UV, quanto sol é demais e como se proteger — especialmente no Brasil, onde o UV é alto o ano quase inteiro.',
    date: '2026-06-18',
    readingMin: 6,
    faqs: [
      {
        q: 'Qual índice UV é considerado perigoso?',
        a: 'A partir de 6 (alto) a proteção já é recomendada; de 8 a 10 (muito alto) a pele desprotegida pode queimar em poucos minutos; 11 ou mais é extremo. Abaixo de 3 (baixo) o risco é pequeno.',
      },
      {
        q: 'Preciso passar protetor solar em dia nublado?',
        a: 'Sim. Boa parte da radiação UV atravessa as nuvens, então dá pra queimar mesmo sem sol aparente. Se o índice UV do dia está alto, a nuvem não é desculpa.',
      },
      {
        q: 'De quanto em quanto tempo devo reaplicar o protetor?',
        a: 'A cada 2 horas, e sempre depois de suar muito, nadar ou se secar com a toalha. Uma camada de manhã não cobre o dia inteiro.',
      },
    ],
    Body: () => (
      <>
        <p className="lead">
          O índice UV é aquele número discreto na previsão que muita gente ignora — até voltar da
          praia parecendo um camarão. Ele resume, num só valor, o quanto o sol está castigando a sua
          pele <strong>agora</strong>. Entender a escala muda como você se protege.
        </p>

        <h2>O que o número quer dizer</h2>
        <p>
          O <strong>índice UV</strong> mede a intensidade da radiação ultravioleta que chega à
          superfície. Quanto maior, mais rápido a pele desprotegida se queima. A escala internacional
          vai de 0 pra cima, agrupada em faixas:
        </p>
        <ul>
          <li>
            <strong>0–2 (baixo)</strong> — risco pequeno. O Zé diz "relaxa". Dá pra ficar tranquilo.
          </li>
          <li>
            <strong>3–5 (moderado)</strong> — proteção recomendada se você vai ficar um tempo no sol.
          </li>
          <li>
            <strong>6–7 (alto)</strong> — passa protetor, óculos e chapéu. A pele queima sem aviso.
          </li>
          <li>
            <strong>8–10 (muito alto)</strong> — "passa agora". Poucos minutos já bastam pra
            queimar; evite o sol do meio-dia.
          </li>
          <li>
            <strong>11+ (extremo)</strong> — proteção máxima e sombra sempre que der.
          </li>
        </ul>

        <h2>Por que isso importa (muito) no Brasil</h2>
        <p>
          O Brasil fica em boa parte na faixa tropical, perto da linha do Equador, onde o sol bate
          mais reto. Resultado: índices <strong>altos ou muito altos durante quase o ano inteiro</strong>,
          não só no verão. Em cidades do Norte e Nordeste, ver UV 11 no meio do dia é rotina. Tratar
          o sol como "coisa de praia" é justamente o erro que leva à queimadura — e, a longo prazo,
          ao envelhecimento precoce e ao risco de câncer de pele.
        </p>

        <h2>Como o BrasilTempo calcula o UV</h2>
        <p>
          O modelo NOAA GFS não entrega o índice UV mastigado, mas entrega a{' '}
          <strong>radiação solar de onda curta</strong> que chega ao solo (em watts por metro
          quadrado). O Zé converte esse fluxo num índice na escala conhecida: quanto mais energia
          solar batendo, maior o UV. É uma estimativa transparente — e o número aparece já traduzido
          em "baixo", "alto" ou "extremo" pra você não precisar decorar faixa nenhuma.
        </p>
        <p>
          Vale lembrar: o UV é mais forte entre as <strong>10h e as 16h</strong>, quando o sol está
          mais alto. O pico que a previsão mostra costuma ser desse intervalo.
        </p>

        <h2>Proteção que funciona</h2>
        <p>Quando o índice estiver alto, o básico bem-feito resolve a maior parte:</p>
        <ul>
          <li>
            <strong>Protetor solar FPS 30 ou mais</strong>, aplicado 15–30 minutos antes de sair.
          </li>
          <li>
            <strong>Reaplique a cada 2 horas</strong> — e depois de suar, nadar ou se secar.
          </li>
          <li>
            <strong>Chapéu, óculos com proteção UV e sombra</strong> no horário de pico.
          </li>
          <li>
            Não confie na nuvem: boa parte do UV atravessa o céu encoberto.
          </li>
        </ul>

        <h2>Olhe o número antes de sair</h2>
        <p>
          Antes do rolê ao ar livre, dá uma espiada no{' '}
          <Link href="/">índice UV da sua cidade</Link> no cartão "Agora". Se o Zé disser "passa
          agora", leve a sério: cinco segundos de protetor evitam três dias de ardência. Sol é vida,
          mas com juízo.
        </p>
      </>
    ),
  },
  {
    slug: 'previsao-7-dias-confiavel',
    title: 'Dá pra confiar na previsão de 7 dias?',
    tag: 'Curiosidade',
    description:
      'Por que o tempo de amanhã é quase certo e o de sábado é só um esboço. Entenda como a precisão da previsão cai com os dias — e como usar os 7 dias do jeito certo.',
    date: '2026-06-25',
    readingMin: 5,
    faqs: [
      {
        q: 'Por quantos dias a previsão do tempo é confiável?',
        a: 'Os primeiros 1 a 3 dias são bastante confiáveis. De 4 a 5 dias a precisão cai, e de 6 a 7 dias a previsão é mais uma tendência do que uma certeza — boa pra se planejar, não pra cravar.',
      },
      {
        q: 'Por que a previsão muda de um dia pro outro?',
        a: 'Porque a cada atualização o modelo recebe dados novos da atmosfera e recalcula. Pequenas diferenças nas condições de hoje viram grandes diferenças daqui a uma semana — é o famoso efeito borboleta.',
      },
    ],
    Body: () => (
      <>
        <p className="lead">
          Você abre a previsão e vê sol garantido no sábado. Chega quinta, virou chuva. Sacanagem? Não
          — é física. A previsão de <strong>amanhã</strong> e a de <strong>daqui a sete dias</strong>{' '}
          não têm a mesma confiança, e entender isso te poupa de frustração (e de cancelar churrasco à
          toa).
        </p>

        <h2>A previsão tem prazo de validade</h2>
        <p>
          Prever o tempo é resolver, num computador, como a atmosfera vai evoluir a partir do estado
          de agora. O problema é que a atmosfera é <strong>caótica</strong>: um errinho minúsculo na
          medida de hoje cresce a cada hora simulada. Em um ou dois dias, esse erro ainda é pequeno.
          Em sete, ele já pode ter virado a diferença entre "sol" e "temporal". É o{' '}
          <strong>efeito borboleta</strong> na prática.
        </p>
        <p>Na média, a confiança costuma cair mais ou menos assim:</p>
        <ul>
          <li>
            <strong>Dias 1 a 3</strong> — alta confiança. Bom pra decisões firmes (levar guarda-chuva,
            marcar a praia).
          </li>
          <li>
            <strong>Dias 4 a 5</strong> — confiança média. Já dá pra ter uma ideia, mas confira de
            novo mais perto.
          </li>
          <li>
            <strong>Dias 6 a 7</strong> — baixa confiança. Trate como <em>tendência</em>, não como
            promessa.
          </li>
        </ul>

        <h2>Por que ela muda toda hora</h2>
        <p>
          O modelo NOAA GFS é recalculado várias vezes ao dia, sempre com observações novas — balões,
          satélites, estações, navios. Cada rodada corrige a anterior. Por isso a previsão de sábado
          pode dançar a semana inteira até "assentar" quando o sábado chega perto. Não é que estava
          errada antes: é que estava sendo refinada.
        </p>

        <h2>Como o Zé lida com isso</h2>
        <p>
          O horizonte do modelo é de cerca de <strong>7 dias</strong>, e é por isso que a tira de
          previsão do BrasilTempo vai até ali — nem mais, pra não vender certeza que não existe. Os
          vereditos do fim de semana (praia, churrasco, rolê ao ar livre) sempre mostram{' '}
          <strong>qual dia</strong> é o melhor e <strong>com que números</strong>, pra você pesar o
          risco com informação na mão, não no escuro.
        </p>

        <h2>Usando os 7 dias do jeito certo</h2>
        <ul>
          <li>
            <strong>Decisão de hoje/amanhã?</strong> Pode confiar no veredito.
          </li>
          <li>
            <strong>Plano pro fim de semana?</strong> Use como esboço e <strong>reconfira na
            quinta ou sexta</strong>.
          </li>
          <li>
            <strong>Viu a previsão mudar?</strong> Ótimo sinal — quer dizer que ela está
            incorporando dados frescos.
          </li>
        </ul>
        <p>
          Previsão não é bola de cristal; é a melhor aposta possível com a ciência de hoje. Quanto
          mais perto o dia, melhor a aposta. Confira a{' '}
          <Link href="/">previsão dos próximos dias na sua cidade</Link> e planeje com a cabeça —
          o Zé te dá o caminho, você dá a caneta.
        </p>
      </>
    ),
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
/** '2026-06-10' → '10 de jun de 2026' (pt-BR, no Date tz surprises). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[(m || 1) - 1]} de ${y}`;
}
