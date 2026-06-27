// Zé do Tempo — the voice of BrasilTempo.
//
// PHRASE STRATEGY (per the brief):
//   - NEVER call an LLM per visitor; that destroys the AdSense margin.
//   - Phrases are generated in a cached, batched, deterministic way.
//
// Two layers:
//   1. STATIC POOLS (ported from the prototype) — the always-on fallback. Used
//      when no ANTHROPIC_API_KEY is set, while a fresh AI batch is still warming,
//      or if a generation fails. A deterministic daily pick keeps them stable.
//   2. AI BATCH (Haiku) — one call generates ALL verdict lines for a scope/day,
//      cached in Firestore (L2) + memory (L1). `getZePhrases()` reads the cache
//      and NEVER blocks a visitor on the model: on a miss it kicks regeneration
//      off in the background and serves the static pool for that one render.
//
// `zePhrase()` (static) stays the floor; `getZePhrases()` returns the AI overlay
// that buildView prefers per pool when present.

import { getCache, setCache } from './firestore';
import { anthropicText, extractJsonObject, brDayKey } from './anthropic';

export type PoolKey =
  | 'rainSim' | 'rainTalvez' | 'rainNao'
  | 'praiaBora' | 'praiaArr' | 'praiaCasa'
  | 'casSim' | 'casTalvez' | 'casNao'
  | 'churAcende' | 'churB' | 'churDentro'
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
  uvAgora: ['Sol de rachar. Passa protetor ou vira pururuca.', 'UV brabo: capricha no protetor, cara pálida.', 'Sol castigando. Sem protetor, sem rua.'],
  uvSim: ['UV alto, passa o protetor antes de sair.', 'Capricha no protetor que o sol tá esperto.', 'Protetor sim, o sol não tá de brincadeira.'],
  uvRec: ['Uma camadinha não faz mal, previne o vermelhão.', 'Passa um protetorzinho só por garantia.', 'Sol moderado, mas protetor nunca é demais.'],
  uvRelaxa: ['Sol fraquinho hoje, pode relaxar no protetor.', 'UV baixo, o sol tá de boa contigo.', 'Hoje o sol deu trégua, sem stress.'],
  resumo: ['No fim das contas, é só olhar pro céu e bora.', 'Confia no Zé que de tempo eu manjo, viu.', 'Anota aí e aproveita o dia, cumpadi.'],
};

const ALL_KEYS = Object.keys(POOLS) as PoolKey[];

// Deterministic daily seed → same phrase all day, fresh tomorrow.
export function daySeed(d = new Date()): number {
  return d.getDate() + d.getMonth() * 31;
}

/** Static fallback: picks a pool line deterministically by day. Never throws. */
export function zePhrase(pool: PoolKey, seed = daySeed()): string {
  const arr = POOLS[pool];
  return arr[seed % arr.length];
}

// ---------------------------------------------------------------------------
// AI overlay (Haiku) — batched + cached. Optional; off until ANTHROPIC_API_KEY.
// ---------------------------------------------------------------------------

/** A (possibly partial) map of AI-written lines, one per pool. */
export type ZePhraseSet = Partial<Record<PoolKey, string>>;

/** Identifies a cache bucket: per-city for curated cities, else 'global'. */
export interface ZeScope {
  key: string; // e.g. 'city_sao-paulo-sp' or 'global'
  cityName?: string; // included in the prompt for local flavor
}

const ZE_COLLECTION = 'zePhrases';
const DAY_TTL_MS = 26 * 60 * 60 * 1000; // survive a full day across the rollover

// One-line description of the verdict each pool key represents, so Haiku writes
// a line that actually matches the situation.
const POOL_BRIEF: Record<PoolKey, string> = {
  rainSim: 'vai chover amanhã, chance alta — avise pra levar guarda-chuva',
  rainTalvez: 'pode chover amanhã, tempo incerto',
  rainNao: 'não chove amanhã, tempo firme',
  praiaBora: 'fim de semana perfeito pra praia',
  praiaArr: 'praia no fds dá pra arriscar, mas com ressalva',
  praiaCasa: 'fim de semana ruim pra praia, melhor ficar em casa',
  casSim: 'frio hoje, precisa de casaco',
  casTalvez: 'friozinho leve, um casaquinho resolve',
  casNao: 'sem frio, não precisa de casaco',
  churAcende: 'fim de semana ótimo pra churrasco',
  churB: 'churrasco no fds com plano B, pode chover',
  churDentro: 'fim de semana ruim pra churrasco, faça dentro',
  uvAgora: 'índice UV extremo, passar protetor agora',
  uvSim: 'UV alto, passar protetor',
  uvRec: 'UV moderado, protetor recomendado',
  uvRelaxa: 'UV baixo, sem preocupação com protetor',
  resumo: 'fechamento bem-humorado do dia, assinatura do Zé',
};

// L1: per-instance memory; inFlight dedupes concurrent regenerations.
const memCache = new Map<string, ZePhraseSet>();
const inFlight = new Set<string>();

/**
 * Returns the AI line set for a scope, or {} if unavailable (callers fall back
 * to the static pool). NEVER blocks on the model: a cache miss serves {} now and
 * triggers a background regeneration so the next render is AI-backed.
 */
export async function getZePhrases(scope: ZeScope): Promise<ZePhraseSet> {
  if (!process.env.ANTHROPIC_API_KEY) return {}; // feature off → static pools
  const docId = `${scope.key}_${brDayKey()}`;

  const mem = memCache.get(docId);
  if (mem) return mem;

  const cached = await getCache<ZePhraseSet>(ZE_COLLECTION, docId, DAY_TTL_MS);
  if (cached && Object.keys(cached).length) {
    memCache.set(docId, cached);
    return cached;
  }

  triggerRegen(scope, docId); // background; this render uses static pools
  return {};
}

function triggerRegen(scope: ZeScope, docId: string): void {
  if (inFlight.has(docId)) return;
  inFlight.add(docId);
  void regenerate(scope, docId).finally(() => inFlight.delete(docId));
}

/**
 * Generate + persist a scope's lines. The cron route awaits this to pre-warm
 * the cache; the app uses the fire-and-forget path above.
 */
export async function regenerateZePhrases(scope: ZeScope): Promise<ZePhraseSet> {
  return regenerate(scope, `${scope.key}_${brDayKey()}`);
}

async function regenerate(scope: ZeScope, docId: string): Promise<ZePhraseSet> {
  try {
    const set = await callHaiku(scope.cityName);
    if (Object.keys(set).length) {
      memCache.set(docId, set);
      await setCache(ZE_COLLECTION, docId, set);
    }
    return set;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[ze] regeneration failed:', (err as Error).message);
    }
    return {};
  }
}

async function callHaiku(cityName?: string): Promise<ZePhraseSet> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return {};

  const where = cityName ? ` para a cidade de ${cityName}` : '';
  const brief = ALL_KEYS.map((k) => `"${k}": ${POOL_BRIEF[k]}`).join('\n');

  const system =
    'Você é o "Zé do Tempo", mascote de um site brasileiro de previsão do tempo. ' +
    'Sua voz é brasileira, bem-humorada, calorosa, com gírias leves e tom de tiozão simpático. ' +
    'Escreva frases curtas (máximo ~70 caracteres), em pt-BR, sem emoji e sem aspas, ' +
    'cada uma adequada ao contexto de veredito informado.';

  const user =
    `Gere UMA frase do Zé${where} para cada chave abaixo. ` +
    `Cada frase precisa combinar com o veredito descrito.\n\n${brief}\n\n` +
    'Responda APENAS com um objeto JSON válido, mapeando cada chave para a sua frase. ' +
    'Sem markdown, sem comentários, sem texto fora do JSON.';

  const text = await anthropicText(system, user, 900);
  return parseSet(text);
}

function parseSet(text: string): ZePhraseSet {
  const obj = extractJsonObject(text);
  if (!obj) return {};

  const out: ZePhraseSet = {};
  for (const k of ALL_KEYS) {
    const v = obj[k];
    if (typeof v === 'string') {
      const line = v.trim().replace(/^["']+|["']+$/g, '');
      if (line) out[k] = line.slice(0, 120);
    }
  }
  return out;
}
