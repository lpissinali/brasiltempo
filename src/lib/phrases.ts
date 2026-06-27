// Zé do Tempo — the voice of BrasilTempo.
//
// PHRASE STRATEGY (per the brief):
//   - NEVER call an LLM per visitor; that destroys the AdSense margin.
//   - Phrases are generated/selected in a cached, deterministic way.
//
// Today: a static pool per verdict (ported verbatim from the prototype) with a
// daily-rotating deterministic pick. The `zePhrase()` function is the single
// seam where, later, you swap in batch-generated Haiku phrases (generated on a
// schedule, cached by verdict+condition+city/day) without touching callers.

export type PoolKey =
  | 'rainSim' | 'rainTalvez' | 'rainNao'
  | 'praiaBora' | 'praiaArr' | 'praiaCasa'
  | 'casSim' | 'casTalvez' | 'casNao'
  | 'churAcende' | 'churB' | 'churDentro'
  | 'roupaPode' | 'roupaArr' | 'roupaNao' | 'roupaDemora'
  | 'uvAgora' | 'uvSim' | 'uvRec' | 'uvRelaxa'
  | 'resumo';

export const POOLS: Record<PoolKey, string[]> = {
  rainSim: ['Leva o guarda-chuva ou aceita virar sopa, tiozão.', 'Amanhã é dia de sofá e ouvir a chuva, relaxa.', 'Vai cair água que nem fim de novela. Guarda-chuva!'],
  rainTalvez: ['O céu tá em cima do muro igual seu ex.', 'Pode pingar, pode não. Leva o casaquinho e reza.', 'Céu indeciso: meio sol, meio cara feia.'],
  rainNao: ['Seco que nem piada de tiozão. Pode planejar.', 'Nuvem nenhuma à vista, bora aproveitar.', 'Amanhã o sol manda um oi, sem desculpa.'],
  praiaBora: ['Bota o protetor e some pra areia, cumpadi.', 'Dia de mar! Deixa a cerveja gelando.', 'Areia te espera. Bora que bora!'],
  praiaArr: ['Dá praia, mas leva plano B na mochila.', 'Vai com fé, mas de olho no céu.', 'Arrisca um mergulho, mas não confia 100%.'],
  praiaCasa: ['Praia não, sofá sim. O mar que espere.', 'Fim de semana é de Netflix, não de areia.', 'Guarda o biquíni, hoje não rola.'],
  casSim: ['Tá frio de renegar sorvete. Casaco pesado!', 'Hoje é dia de casacão e chocolate quente.', 'Frio brabo: agasalha que nem cebola.'],
  casTalvez: ['Leva um casaquinho, vai que esfria na volta.', 'Um agasalho leve resolve o seu dia.', 'Casaquinho na mochila e tá tranquilo.'],
  casNao: ['Casaco? Só se for de preguiça. Tá gostoso.', 'Pode sair de regata, o dia colabora.', 'Esquenta nada, deixa o casaco em casa.'],
  churAcende: ['Acende a grelha que o tempo colabora, graças!', 'Compra a linguiça: dia perfeito de churras.', 'Bora carvão! O céu deu o aval.'],
  churB: ['Compra a carne, mas deixa a varanda de prontidão.', 'Churras com plano B na manga, vai dar.', 'Arrisca o churrasco, mas reza um tiquinho.'],
  churDentro: ['Churrasco na chuva é tristeza. Faz na garagem.', 'Melhor fritar a linguiça hoje, confia.', 'Guarda o carvão, o céu não tá pra brincadeira.'],
  roupaPode: ['Estende tudo, o sol seca antes do café.', 'Pode estender que hoje seca rapidinho.', 'Varal cheio: dia de sol pra secar.'],
  roupaArr: ['Estende, mas fica de olho no céu, hein.', 'Arrisca o varal, mas não vacila.', 'Pode pendurar, só não some de casa.'],
  roupaNao: ['Nem tenta, vai voltar mais molhada que saiu.', 'Varal hoje é furada, guarda a roupa.', 'Deixa pra amanhã, hoje não seca nada.'],
  roupaDemora: ['Pode estender, mas vai secar lá pra noite.', 'Seca, mas com calma. Sem pressa, tá nublado.', 'Pendura, mas não conta com pressa hoje.'],
  uvAgora: ['Sol de rachar. Passa protetor ou vira pururuca.', 'UV brabo: capricha no protetor, cara pálida.', 'Sol castigando. Sem protetor, sem rua.'],
  uvSim: ['UV alto, passa o protetor antes de sair.', 'Capricha no protetor que o sol tá esperto.', 'Protetor sim, o sol não tá de brincadeira.'],
  uvRec: ['Uma camadinha não faz mal, previne o vermelhão.', 'Passa um protetorzinho só por garantia.', 'Sol moderado, mas protetor nunca é demais.'],
  uvRelaxa: ['Sol fraquinho hoje, pode relaxar no protetor.', 'UV baixo, o sol tá de boa contigo.', 'Hoje o sol deu trégua, sem stress.'],
  resumo: ['No fim das contas, é só olhar pro céu e bora.', 'Confia no Zé que de tempo eu manjo, viu.', 'Anota aí e aproveita o dia, cumpadi.'],
};

// Deterministic daily seed → same phrase all day, fresh tomorrow.
export function daySeed(d = new Date()): number {
  return d.getDate() + d.getMonth() * 31;
}

/**
 * The single seam for Zé's voice. Today it picks from a static pool.
 *
 * LATER: replace the body with a lookup into a cache of batch-generated Haiku
 * phrases keyed by (pool, city, day). Signature stays the same, so callers and
 * the verdict engine never change. Suggested cache: Firestore doc per
 * city/day holding one phrase per PoolKey, regenerated on a schedule.
 */
export function zePhrase(pool: PoolKey, seed = daySeed()): string {
  const arr = POOLS[pool];
  return arr[seed % arr.length];
}
