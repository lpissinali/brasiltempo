import { NextRequest, NextResponse } from 'next/server';
import type { City } from '@/lib/types';
import { DEFAULT_CITY } from '@/lib/cities';
import { getForecast } from '@/lib/gfs';
import { buildView } from '@/lib/verdicts';

// "Pergunta o que quiser pro Zé" — free-question box backend.
//
// SKELETON: naive keyword → verdict intent matching, then answers with the
// matching verdict card (data-anchored, in Zé's voice). NO LLM per request.
//
// LATER (the AI seam): replace `detectIntent` + answer assembly with one cheap
// Haiku call that (a) extracts intent + time window + relevant variables, (b)
// reads the already-fetched forecast, (c) returns the verdict in Zé's voice.

const INTENTS: { key: string; words: string[] }[] = [
  { key: 'praia', words: ['praia', 'mar', 'areia', 'banho de mar', 'mergulh'] },
  { key: 'churrasco', words: ['churras', 'grelha', 'carne', 'linguiça', 'churrasco'] },
  { key: 'casaco', words: ['casaco', 'frio', 'agasalho', 'blusa', 'friozinho'] },
  { key: 'roupa', words: ['roupa', 'varal', 'estender', 'estende', 'secar', 'lavar'] },
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
    const city = asCity(body.city);
    const forecast = await getForecast(city);
    const view = buildView(city, forecast);

    const intentKey = detectIntent(String(body.question || ''));
    const card = view.cards.find((c) => c.key === intentKey) || view.cards[0];

    return NextResponse.json({
      city: city.n,
      verdict: card.big,
      ze: card.ze,
      meta: card.meta,
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
