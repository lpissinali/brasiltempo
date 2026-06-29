import { CAPITALS } from './cities';
import { getForecast } from './gfs';

// Compact, one-line-per-city snapshot of the curated cities' current weather, so
// the free-question box can answer NATIONWIDE comparisons ("qual a cidade mais
// fria do Brasil hoje?") without handing the model every city's full forecast.
// Cached 30 min in memory; each getForecast is itself cached (mem + Firestore),
// so a warm cache makes this cheap. Bounded to the 27 capitals (not the full
// ~100-city list) so a cold snapshot is at most 27 fetches — enough for an
// honest "entre as capitais do Brasil" answer.
const r = Math.round;
const TTL = 30 * 60 * 1000;
let cache: { text: string; ts: number } | null = null;

export async function nationalSnapshot(): Promise<string> {
  if (cache && Date.now() - cache.ts < TTL) return cache.text;
  const rows = await Promise.all(
    CAPITALS.map(async (c) => {
      try {
        const f = await getForecast(c);
        const cur = f.current;
        const dl = f.daily;
        const max = dl.temperature_2m_max?.[0];
        const min = dl.temperature_2m_min?.[0];
        const prob = dl.precipitation_probability_max?.[0];
        return `${c.n}/${c.uf}: agora ${r(cur.temperature_2m)}°, máx ${r(max ?? 0)}°, mín ${r(min ?? 0)}°, chuva ${r(prob ?? 0)}%`;
      } catch {
        return null;
      }
    }),
  );
  const text = rows.filter(Boolean).join('\n');
  cache = { text, ts: Date.now() };
  return text;
}
