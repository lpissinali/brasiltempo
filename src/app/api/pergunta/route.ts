import { NextRequest, NextResponse } from 'next/server';
import type { City } from '@/lib/types';
import { DEFAULT_CITY, getCityBySlug } from '@/lib/cities';
import { getForecast } from '@/lib/gfs';
import { buildView } from '@/lib/verdicts';
import { askZe } from '@/lib/ask';

// "Pergunta o que quiser pro Zé" — free-question box backend.
//
// PRIMARY: one Haiku call (src/lib/ask.ts) reads the live forecast and answers
// the user's free-form question in Zé's voice. Cached per question/city/day,
// length-capped, and only when ANTHROPIC_API_KEY is set.
//
// FALLBACK: naive keyword → verdict intent matching, answering with the closest
// verdict card. Used when the AI is unavailable (no key / error). The keyword
// card also supplies the icon + accent for the UI in both paths.

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
    const city = asCity(body.city);
    const forecast = await getForecast(city);
    const view = buildView(city, forecast);

    // Keyword card: the fallback answer + the icon/accent for the UI.
    const intentKey = detectIntent(question);
    const card = view.allCards.find((c) => c.key === intentKey) || view.allCards[0];

    // Curated cities share a per-city answer cache; everything else is global.
    const scopeKey = getCityBySlug(city.slug) ? `city_${city.slug}` : 'global';
    const ai = await askZe(question, view, scopeKey);

    return NextResponse.json({
      city: city.n,
      verdict: ai?.verdict ?? card.big,
      ze: ai?.ze ?? card.ze,
      meta: ai?.meta ?? card.meta,
      icon: card.icon,
      accent: card.accent,
      source: view.source,
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'O Zé tropeçou nos dados. Tenta de novo daqui a pouco.' },
      { status: 500 },
    );
  }
}
