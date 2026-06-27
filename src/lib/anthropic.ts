// Shared Anthropic (Claude) client helpers — used by both the batched verdict
// phrases (src/lib/phrases.ts) and the free-question box (src/lib/ask.ts).
//
// Thin wrapper over the Messages REST API (no SDK dependency). Throws when no
// key is configured or the call fails, so callers can fall back gracefully.

export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

/** One-shot text completion. Returns the assistant's concatenated text. */
export async function anthropicText(system: string, user: string, maxTokens = 600): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}`);

  const json: any = await res.json();
  return (json.content || []).map((b: any) => b?.text || '').join('').trim();
}

/** Robustly pull the first JSON object out of a model reply (handles ``` fences and prose). */
export function extractJsonObject(text: string): Record<string, unknown> | null {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** YYYYMMDD in America/São_Paulo, so daily caches line up with Brazil. */
export function brDayKey(d = new Date()): string {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return f.format(d).replace(/-/g, '');
}
