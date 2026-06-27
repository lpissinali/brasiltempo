// "Pergunta o que quiser pro Zé" — natural-language answers via Haiku.
//
// Unlike the verdict phrases (batched once per day), this is per submitted
// question — but it's a deliberate user action (low volume vs page views), the
// input is length-capped, and identical questions are cached per city/day in
// Firestore. Returns null when no key / on any error, so the route falls back to
// the keyword matcher. Haiku answers using ONLY the day's forecast context.

import type { BuiltView } from './verdicts';
import { anthropicText, extractJsonObject, brDayKey } from './anthropic';
import { getCache, setCache } from './firestore';

export interface ZeAnswer {
  verdict: string;
  ze: string;
  meta: string;
}

const ANSWER_COLLECTION = 'zeAnswers';
const DAY_TTL_MS = 26 * 60 * 60 * 1000;
const MAX_Q = 200;

// djb2 — short, stable id for the (question) part of the cache key.
function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function buildContext(v: BuiltView): string {
  const hrs = v.hours.map((h) => `${h.hour} ${h.temp}° ${h.prob}%`).join('; ');
  const verds = v.allCards.map((c) => `- ${c.q} ${c.big} (${c.meta})`).join('\n');
  return [
    `Cidade: ${v.cidade}`,
    `Agora: ${v.temp}°C (sensação ${v.feels}°), ${v.skyLabel}, umidade ${v.humidity}%, vento ${v.windKmh} km/h, UV ${v.uv}.`,
    `Hoje: máx ${v.maxToday}°, mín ${v.minToday}°, chance de chuva ${v.probToday}%.`,
    `Próximas horas (hora temp chuva%): ${hrs}`,
    'Vereditos do dia:',
    verds,
  ].join('\n');
}

const SYSTEM =
  'Você é o "Zé do Tempo", mascote brasileiro de previsão do tempo: bem-humorado, ' +
  'caloroso, com gírias leves e tom de tiozão simpático. Responda à pergunta do ' +
  'usuário usando SOMENTE os dados fornecidos. Se a pergunta citar um período ' +
  '(manhã, tarde, noite, agora), baseie-se nas próximas horas. Nunca invente número ' +
  'que não esteja nos dados. Responda SEMPRE só com JSON, sem markdown: ' +
  '{"verdict":"veredito curto, 1 a 4 palavras, em MAIÚSCULAS","ze":"uma frase curta e ' +
  'bem-humorada, máx ~80 caracteres, sem emoji","meta":"o dado que justifica, bem curto"}.';

export async function askZe(question: string, view: BuiltView, scopeKey: string): Promise<ZeAnswer | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const q = question.trim().replace(/\s+/g, ' ').slice(0, MAX_Q);
  if (!q) return null;

  const docId = `${scopeKey}_${brDayKey()}_${hash(q.toLowerCase())}`;
  const cached = await getCache<ZeAnswer>(ANSWER_COLLECTION, docId, DAY_TTL_MS);
  if (cached) return cached;

  try {
    const user = `Pergunta do usuário: "${q}"\n\nDados:\n${buildContext(view)}`;
    const obj = extractJsonObject(await anthropicText(SYSTEM, user, 300));
    if (!obj) return null;

    const verdict = typeof obj.verdict === 'string' ? obj.verdict.trim().slice(0, 40) : '';
    const ze = typeof obj.ze === 'string' ? obj.ze.trim().replace(/^["']+|["']+$/g, '').slice(0, 140) : '';
    const meta = typeof obj.meta === 'string' ? obj.meta.trim().slice(0, 60) : '';
    if (!verdict || !ze) return null;

    const ans: ZeAnswer = { verdict, ze, meta };
    await setCache(ANSWER_COLLECTION, docId, ans);
    return ans;
  } catch {
    return null;
  }
}
