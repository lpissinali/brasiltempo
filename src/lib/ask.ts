// "Pergunta o que quiser pro Zé" — natural-language answers via Haiku.
//
// One Haiku call answers a free-form question using the day's forecast as
// context, in Zé's voice. Two extra behaviours:
//   - CITY REDIRECT: if the question is about a different place than the page's
//     city, the model returns {city:"..."} instead of an answer; the route then
//     geocodes it, fetches that city's forecast, and re-asks (no further
//     redirect). When no place is named, the page's city is used.
//   - OFF-TOPIC: non-weather questions still get a playful Zé answer that nudges
//     back to the weather.
//
// Caching + geocoding orchestration live in the route; this module is just the
// Haiku call(s) + the answer cache helpers. Returns null when no key / on error
// so the route can fall back to the keyword matcher.

import type { BuiltView } from './verdicts';
import { anthropicText, extractJsonObject, brDayKey } from './anthropic';
import { getCache, setCache } from './firestore';

export interface ZeAnswer {
  verdict: string;
  ze: string;
  meta: string;
  offtopic?: boolean; // true when the question isn't about the weather
  topic?: string; // weather category of the answer → drives the UI icon
  cityName?: string; // set when the answer resolved to a DIFFERENT city than the page
  citySlug?: string; // → the box can link to that city's full forecast
}

export type AskResult = ({ kind: 'answer' } & ZeAnswer) | { kind: 'city'; city: string };

const ANSWER_COLLECTION = 'zeAnswers';
const DAY_TTL_MS = 26 * 60 * 60 * 1000;
const MAX_Q = 200;

function normalize(question: string): string {
  return question.trim().replace(/\s+/g, ' ').slice(0, MAX_Q);
}

// djb2 — short, stable id for the (question) part of the cache key.
function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// Trim to a max length without cutting a word in half.
function clip(s: string, n: number): string {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const sp = cut.lastIndexOf(' ');
  return (sp > 40 ? cut.slice(0, sp) : cut).trimEnd() + '…';
}

function buildContext(v: BuiltView, national?: string): string {
  const hrs = v.hours.map((h) => `${h.hour} ${h.temp}° ${h.prob}%`).join('; ');
  const dias = v.days.map((dia) => `${dia.dn} ${dia.prob}%`).join('; ');
  const verds = v.allCards.map((c) => `- ${c.q} ${c.big} (${c.meta})`).join('\n');
  const janela = v.rainAlert
    ? `Janela de chuva hoje: ${v.rainAlert.title}.`
    : 'Sem janela de chuva significativa hoje.';
  const lines = [
    `Cidade: ${v.cidade}`,
    `Agora: ${v.temp}°C (sensação ${v.feels}°), ${v.skyLabel}, umidade ${v.humidity}%, vento ${v.windKmh} km/h, UV ${v.uv}.`,
    `Hoje: máx ${v.maxToday}°, mín ${v.minToday}°, chance de chuva ${v.probToday}%.`,
    janela,
    `Próximas horas (hora temp chuva%): ${hrs}`,
    `Próximos dias (dia chuva%): ${dias}`,
    'Vereditos do dia:',
    verds,
  ];
  if (national) {
    lines.push(
      '',
      'Panorama nacional de hoje (principais cidades — use para comparações tipo "mais fria/quente do Brasil"):',
      national,
    );
  }
  return lines.join('\n');
}

const PERSONA =
  'Você é a voz do BrasilTempo, um site brasileiro de previsão do tempo: bem-humorado, ' +
  'caloroso, com gírias leves e tom de tiozão simpático. Nunca se apresente com um nome próprio nem ' +
  'se refira a um mascote; fale como a marca BrasilTempo ("a gente").';

function systemPrompt(allowRedirect: boolean): string {
  const base =
    PERSONA +
    ' Responda usando SOMENTE os dados fornecidos; nunca invente números. ' +
    'Se a pergunta citar um período (manhã, tarde, noite, agora), use as próximas horas; ' +
    'se citar "amanhã" ou dias da semana, use os próximos dias. ' +
    'Se houver um panorama nacional nos dados, use-o para responder comparações entre cidades do ' +
    'Brasil (ex.: a mais fria ou mais quente hoje), citando a cidade e o número. ' +
    'Se a pergunta for nacional ou sobre um lugar SEM dados disponíveis, não invente números: diga ' +
    'com bom humor que dá pra ver o tempo de qualquer cidade e peça pra pessoa indicar uma cidade. ' +
    'Se a pergunta NÃO for sobre o tempo, responda mesmo assim no seu estilo, com bom humor, ' +
    'dando uma resposta leve e puxando de volta pro clima — e marque "offtopic": true. ' +
    'Responda SEMPRE só com JSON, sem markdown: ' +
    '{"verdict":"1 a 4 palavras em MAIÚSCULAS","ze":"frase curta e bem-humorada, máx ~90 caracteres, sem emoji",' +
    '"meta":"um dado curto e concreto do tempo, ex.: \\"Curitiba 12° agora\\" — vazio \\"\\" se não for sobre clima",' +
    '"topic":"a categoria do clima na sua resposta, UM de: chuva, sol, calor, frio, vento, umidade, praia, uv — ou string vazia \\"\\" quando não fizer sentido um ícone",' +
    '"offtopic": true se a pergunta não for sobre tempo/clima, caso contrário false}. Nunca escreva instruções dentro do JSON.';
  const redirect =
    ' MUITO IMPORTANTE: se a pergunta for claramente sobre UMA CIDADE ou LUGAR específico diferente da ' +
    'cidade dos dados acima (e não uma comparação nacional), NÃO responda o clima — retorne só {"city":"<nome do lugar citado>"}.';
  return allowRedirect ? base + redirect : base;
}

/** One Haiku call against a given city's view. May ask the route to switch city.
 *  `national` (optional) is a compact snapshot of the curated cities so the model
 *  can answer nationwide comparisons. */
export async function askZeOnce(
  question: string,
  view: BuiltView,
  allowRedirect: boolean,
  national?: string,
): Promise<AskResult | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const q = normalize(question);
  if (!q) return null;

  try {
    const user = `Pergunta do usuário: "${q}"\n\nDados:\n${buildContext(view, national)}`;
    const obj = extractJsonObject(await anthropicText(systemPrompt(allowRedirect), user, 300));
    if (!obj) return null;

    if (allowRedirect && typeof obj.city === 'string' && obj.city.trim() && typeof obj.verdict !== 'string') {
      return { kind: 'city', city: obj.city.trim().slice(0, 80) };
    }

    const verdict = typeof obj.verdict === 'string' ? clip(obj.verdict.trim(), 40) : '';
    const ze = typeof obj.ze === 'string' ? clip(obj.ze.trim().replace(/^["']+|["']+$/g, ''), 150) : '';
    const meta = typeof obj.meta === 'string' ? clip(obj.meta.trim(), 70) : '';
    const offtopic = obj.offtopic === true;
    const topic = typeof obj.topic === 'string' ? obj.topic.trim().toLowerCase() : '';
    if (!verdict || !ze) return null;
    return { kind: 'answer', verdict, ze, meta, offtopic, topic };
  } catch {
    return null;
  }
}

function cacheId(scopeKey: string, question: string): string {
  return `${scopeKey}_${brDayKey()}_${hash(normalize(question).toLowerCase())}`;
}

export async function getCachedAnswer(scopeKey: string, question: string): Promise<ZeAnswer | null> {
  if (!normalize(question)) return null;
  return getCache<ZeAnswer>(ANSWER_COLLECTION, cacheId(scopeKey, question), DAY_TTL_MS);
}

export async function setCachedAnswer(scopeKey: string, question: string, ans: ZeAnswer): Promise<void> {
  if (!normalize(question)) return;
  await setCache(ANSWER_COLLECTION, cacheId(scopeKey, question), ans);
}
