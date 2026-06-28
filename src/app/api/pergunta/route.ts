import { NextRequest, NextResponse } from 'next/server';
import type { City } from '@/lib/types';
import { DEFAULT_CITY, getCityBySlug } from '@/lib/cities';
import { getForecast } from '@/lib/gfs';
import { buildView, type BuiltView } from '@/lib/verdicts';
import { searchPlaces, placeToCity } from '@/lib/geocode';
import { askZeOnce, getCachedAnswer, setCachedAnswer, type ZeAnswer } from '@/lib/ask';

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

// Off-topic answers (math, trivia, etc.) get a neutral chat icon instead of a
// weather verdict icon, so they don't masquerade as a rain/sun answer.
const OFFTOPIC_ICON = '💬';
const OFFTOPIC_ACCENT = '#64748b';

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

    // Answers cache + the icon/accent come from the page the user asked on.
    const pageScope = getCityBySlug(pageCity.slug) ? `city_${pageCity.slug}` : 'global';

    let ans: ZeAnswer | null = await getCachedAnswer(pageScope, question);
    let answerCity = pageCity;
    let answerView: BuiltView = pageView;

    if (!ans) {
      let result = await askZeOnce(question, pageView, true);

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

      if (result && result.kind === 'answer') {
        ans = { verdict: result.verdict, ze: result.ze, meta: result.meta, offtopic: result.offtopic };
        await setCachedAnswer(pageScope, question, ans);
      }
    }

    // Icon/accent from the keyword intent on whichever city we answered for —
    // unless it's an off-topic question, which gets a neutral chat icon.
    const intentKey = detectIntent(question);
    const card = answerView.allCards.find((c) => c.key === intentKey) || answerView.allCards[0];

    if (ans) {
      return NextResponse.json({
        city: answerCity.n,
        verdict: ans.verdict,
        ze: ans.ze,
        meta: ans.meta,
        icon: ans.offtopic ? OFFTOPIC_ICON : card.icon,
        accent: ans.offtopic ? OFFTOPIC_ACCENT : card.accent,
        source: answerView.source,
      });
    }

    // No AI (no key / error) → keyword fallback on the page city.
    const fb = pageView.allCards.find((c) => c.key === intentKey) || pageView.allCards[0];
    return NextResponse.json({
      city: pageCity.n,
      verdict: fb.big,
      ze: fb.ze,
      meta: fb.meta,
      icon: fb.icon,
      accent: fb.accent,
      source: pageView.source,
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'O Zé tropeçou nos dados. Tenta de novo daqui a pouco.' },
      { status: 500 },
    );
  }
}
