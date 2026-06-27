import { NextResponse } from 'next/server';
import { CITIES } from '@/lib/cities';
import { regenerateZePhrases, type ZeScope } from '@/lib/phrases';

// Optional daily pre-warm for Zé's AI phrases. Point Cloud Scheduler at:
//   GET https://<your-domain>/api/cron/phrases?key=<CRON_SECRET>
// It regenerates the global set + every curated city for today and caches them
// in Firestore, so even the day's first visitor gets AI lines (not the canned
// pool). Safe to leave unscheduled — the app's lazy path covers it; this just
// removes the first-visitor warm-up. No-op cost-wise until you actually call it.

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  const url = new URL(req.url);
  const provided = url.searchParams.get('key') || req.headers.get('x-cron-key');
  if (provided !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  const scopes: ZeScope[] = [
    { key: 'global' },
    ...CITIES.map((c) => ({ key: `city_${c.slug}`, cityName: c.n })),
  ];

  // Limited concurrency so we don't hammer the API or blow the timeout.
  const CONCURRENCY = 3;
  const results: { scope: string; ok: boolean; lines: number }[] = [];
  for (let i = 0; i < scopes.length; i += CONCURRENCY) {
    const batch = scopes.slice(i, i + CONCURRENCY);
    const settled = await Promise.all(
      batch.map(async (s) => {
        const set = await regenerateZePhrases(s);
        return { scope: s.key, ok: Object.keys(set).length > 0, lines: Object.keys(set).length };
      }),
    );
    results.push(...settled);
  }

  const warmed = results.filter((r) => r.ok).length;
  return NextResponse.json({ warmed, total: results.length, results });
}
