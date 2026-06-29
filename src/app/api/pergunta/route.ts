import { NextRequest, NextResponse } from 'next/server';
import type { City } from '@/lib/types';
import { DEFAULT_CITY, getCityBySlug, CITIES } from '@/lib/cities';
import { getForecast } from '@/lib/gfs';
import { buildView, type BuiltView } from '@/lib/verdicts';
import { searchPlaces, placeToCity } from '@/lib/geocode';
import { askZeOnce, getCachedAnswer, setCachedAnswer, type ZeAnswer, type AskResult } from '@/lib/ask';
import { nationalSnapshot } from '@/lib/national';

// "Pergunta o que quiser pro Zé" — free-question box backend.
//
// PRIMARY: Haiku (src/lib/ask.ts) reads the live forecast and answers any
// free-form question in Zé's voice. If the question is about a different city
// than the page's, Haiku flags it and we geocode + re-ask for that city. Answers
// are cached per question/page/day; off-topic questions still get a playful reply.
//
// FALLBACK: naive keyword → verdict intent matching, answering with the closest
// verdict card. Used when the AI is unavailable (no key / error). The keyword
// card also supplies the icon + accent for the UI in both paths.

const NEUTRAL_ACCENT = '#64748b';

// The AI tags its answer with a weather topic; the icon follows the ANSWER, not
// a keyword guess on the question. Anything without a clear topic (off-topic,
// generic, nationwide chit-chat) gets NO icon rather than a misleading one.
const TOPIC_ICON: Record<string, { icon: string; accent: string }> = {
  chuva: { icon: '🌧️', accent: '#2E7BD6' },
  sol: { icon: '☀️', accent: '#F59E0B' },
  calor: { icon: '🌡️', accent: '#E8590C' },
  frio: { icon: '🧥', accent: '#6366F1' },
  vento: { icon: '🍃', accent: '#0EA5A5' },
  umidade: { icon: '💧', accent: '#2E7BD6' },
  praia: { icon: '🏖️', accent: '#0EA5A5' },
  uv: { icon: '🧴', accent: '#F59E0B' },
};

// Nationwide / comparison questions that aren't about one city. These get the
// curated-cities snapshot fed to the model and a shared 'national' answer cache.
const NATIONAL_RE = /\b(brasil|pa[ií]s|nacional|mais (fri[ao]|quente|gelad[ao]|úmid[ao]|sec[ao])|cidade mais|onde (faz|est[aá]|chove|venta)|ranking)\b/i;

const INTENTS: { key: string; words: string[] }[] = [
  { key: 'praia', words: ['praia', 'mar', 'areia', 'banho de mar', 'mergulh'] },
  { key: 'churrasco', words: ['churras', 'grelha', 'carne', 'linguiça', 'churrasco'] },
  { key: 'casaco', words: ['casaco', 'frio', 'agasalho', 'blusa', 'friozinho'] },
  { key: 'protetor', words: ['protetor', 'sol', 'uv', 'queimar', 'bronz', 'pele'] },
  { key: 'chover', words: ['chuva', 'chover', 'chove', 'guarda-chuva', 'molhar', 'pingar'] },
];

function detectIntent(q: string): string {
  const s = q.toLowerCase();
  for (const it of INTENTS) {
    if (it.words.some((w) => s.includes(w))) return it.key;
  }
  if (/(corre|caminh|pedal|bike|passe|pipa|cachorro|sair|rua|treino|jog)/.test(s)) return 'chover';
  return 'chover';
}

// --- deterministic (no-AI) fallback helpers ---
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// City names that double as common words — skip in the no-AI city detector.
const AMBIG_CITY = new Set(['natal', 'serra', 'franca', 'paulista', 'vitoria', 'santos']);

// Best-effort: find a curated city named in the question (whole-word, accent-
// insensitive). Lets the keyword fallback answer for the RIGHT city without an LLM.
function findCityInQuestion(question: string): City | null {
  const nq = norm(question);
  let best: City | null = null;
  for (const c of CITIES) {
    const nn = norm(c.n);
    if (AMBIG_CITY.has(nn)) continue;
    const re = new RegExp(`\\b${nn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (re.test(nq) && (!best || nn.length > norm(best.n).length)) best = c;
  }
  return best;
}

const TEMP_RE = /\b(temperatura|graus?|m[aá]xima|m[ií]nima|term[oô]metro|quente|frio|calor|esquent|esfri)\b/;

function tempQuip(max: number): string {
  if (max >= 34) return 'Calorão de rachar — hidrata e foge do sol.';
  if (max >= 30) return 'Vai esquentar bem, capricha na água.';
  if (max >= 25) return 'Calor gostoso, dia de aproveitar.';
  if (max >= 20) return 'Tempo ameno, bem de boa.';
  if (max >= 15) return 'Fresquinho, um casaquinho cai bem.';
  return 'Frio na área, agasalha que é melhor.';
}

interface FbAnswer { verdict: string; ze: string; meta: string; icon: string; accent: string; }

// Deterministic answer from the forecast: temperature questions get the daily
// range; everything else maps to the closest verdict card.
function fallbackAnswer(question: string, v: BuiltView): FbAnswer {
  if (TEMP_RE.test(norm(question))) {
    return {
      verdict: `${v.maxToday}° / ${v.minToday}°`,
      ze: tempQuip(v.maxToday),
      meta: `máx ${v.maxToday}° · mín ${v.minToday}° hoje · agora ${v.temp}°`,
      icon: '🌡️',
      accent: '#E8590C',
    };
  }
  const intentKey = detectIntent(question);
  const card = v.allCards.find((c) => c.key === intentKey) || v.allCards[0];
  return { verdict: card.big, ze: card.ze, meta: card.meta, icon: card.icon, accent: card.accent };
}

function asCity(input: any): City {
  if (input && Number.isFinite(input.lat) && Number.isFinite(input.lon)) {
    return {
      n: input.n || input.slug || 'sua cidade',
      uf: input.uf || '',
      country: input.country,
      lat: input.lat,
      lon: input.lon,
      slug: input.slug || 'busca',
      tz: typeof input.tz === 'number' ? input.tz : -3,
    };
  }
  return DEFAULT_CITY;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = String(body.question || '');
    const pageCity = asCity(body.city);
    const pageView = buildView(pageCity, await getForecast(pageCity));

    const isNational = NATIONAL_RE.test(question);
    // Nationwide answers don't depend on the page → share one 'national' cache.
    const pageScope = getCityBySlug(pageCity.slug) ? `city_${pageCity.slug}` : 'global';
    const scope = isNational ? 'national' : pageScope;

    let ans: ZeAnswer | null = await getCachedAnswer(scope, question);
    let answerCity = pageCity;
    let answerView: BuiltView = pageView;

    if (!ans) {
      let result: AskResult | null;
      if (isNational) {
        // Feed the curated-cities snapshot so the model can compare across Brazil.
        const national = await nationalSnapshot().catch(() => '');
        result = await askZeOnce(question, pageView, false, national);
      } else {
        result = await askZeOnce(question, pageView, true);
        // The question is about another place → geocode it and answer for that city.
        if (result && result.kind === 'city') {
          const places = await searchPlaces(result.city).catch(() => []);
          if (places.length) {
            answerCity = placeToCity(places[0]);
            answerView = buildView(answerCity, await getForecast(answerCity));
            result = await askZeOnce(question, answerView, false);
          } else {
            result = await askZeOnce(question, pageView, false); // couldn't resolve → page city
          }
        }
      }

      if (result && result.kind === 'answer') {
        ans = { verdict: result.verdict, ze: result.ze, meta: result.meta, offtopic: result.offtopic, topic: result.topic };
        // Remember the resolved city when it differs from the page, so the link
        // survives a cache hit (geocoding only runs on a miss). Omit when equal /
        // national so no undefined fields reach Firestore.
        if (!isNational && answerCity.slug !== pageCity.slug) {
          ans.cityName = answerCity.n;
          ans.citySlug = answerCity.slug;
        }
        await setCachedAnswer(scope, question, ans);
      }
    }

    if (ans) {
      // Icon follows the answer's topic; none when it doesn't make sense.
      const t = ans.offtopic ? null : TOPIC_ICON[ans.topic || ''] || null;
      return NextResponse.json({
        city: ans.cityName || answerCity.n,
        verdict: ans.verdict,
        ze: ans.ze,
        meta: ans.meta,
        icon: t?.icon ?? '',
        accent: t?.accent ?? NEUTRAL_ACCENT,
        source: answerView.source,
        // Link to the full forecast when the answer is about another city.
        cityName: ans.citySlug ? ans.cityName : '',
        citySlug: ans.citySlug || '',
      });
    }

    // No AI (no key / error) → deterministic fallback. Detect a named curated
    // city so we answer for the RIGHT place, and handle temperature questions.
    const detected = isNational ? null : findCityInQuestion(question);
    const fbView = detected ? buildView(detected, await getForecast(detected)) : pageView;
    const fb = fallbackAnswer(question, fbView);
    const showFbCity = !!detected && detected.slug !== pageCity.slug;
    return NextResponse.json({
      city: detected ? detected.n : pageCity.n,
      verdict: fb.verdict,
      ze: fb.ze,
      meta: fb.meta,
      icon: fb.icon,
      accent: fb.accent,
      source: fbView.source,
      cityName: showFbCity ? detected!.n : '',
      citySlug: showFbCity ? detected!.slug : '',
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'Tropeçamos nos dados. Tenta de novo daqui a pouco.' },
      { status: 500 },
    );
  }
}
