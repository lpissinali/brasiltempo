# BrasilTempo — Project Handoff / Context

Paste this into a new chat to continue development.

## What it is
**BrasilTempo** ("Vai Dar?") — a Brazilian (pt-BR) weather oracle with personality. Instead of a
dashboard of numbers, the mascot **Zé do Tempo** answers real-life questions ("vai chover amanhã?",
"rola praia no fds?", "preciso de casaco?") with a big verdict, a funny line, and supporting data.
Monetization target: AdSense (needs volume + recurring visits), so the moat is **personality +
answering the real question**, not raw data.

## Location & stack
- Project root: `D:\Work\brasiltempo` (this is the live build, runs locally).
- **Next.js 14.2.35** (App Router, TypeScript, SSR) + React 18.
- Deploy target: **Firebase App Hosting** (managed Next SSR) — `apphosting.yaml` is configured.
- Run: `npm install` then `npm run dev` (Node 20). Build: `npm run build`. Typecheck: `npm run typecheck`.

## Data — NOAA GFS (no Open-Meteo for weather)
- Source: **NOAA GFS via PacIOOS ERDDAP** (public domain, commercial use OK, no API key).
  Dataset `ncep_global`, 0.5°, 3-hourly, lon 0–360, ~7-day horizon. Global coverage.
- `src/lib/gfs.ts` fetches raw GFS vars (tmp2m K, rh2m %, pratesfc kg/m²/s, dswrfsfc W/m², winds,
  prmslmsl Pa) and **normalizes them into an Open-Meteo-shaped object** so the verdict engine is
  source-agnostic. Cached server-side 30 min (in-memory + Next revalidate) so ERDDAP isn't hit per visitor.
- **Derived (documented proxies, tunable):** weather_code (from precip rate + humidity), precip
  probability, UV index (from shortwave flux), apparent temp, cloud cover (from humidity),
  wind dir/gust, sunrise/sunset (`src/lib/sun.ts`), moon phase (`src/lib/moon.ts`).

## Verdicts & Zé's voice
- `src/lib/verdicts.ts` — the 6 verdicts (chuva amanhã, praia fds, casaco, churrasco, estender roupa,
  protetor), thresholds ported verbatim from the prototype. `buildView()` returns everything the UI needs.
- `src/lib/phrases.ts` — Zé's phrase POOLS (ported) with deterministic daily pick. **`zePhrase()` is
  the single seam to later swap in batch-generated Haiku phrases** (cache by verdict+condition+city/day;
  NEVER call an LLM per visitor — it kills the AdSense margin). AI is **stubbed, not wired**.
- `src/app/api/pergunta/route.ts` — free-question box backend; naive keyword→intent matching now,
  the spot where Haiku plugs in later (accepts full city incl. coords).

## Worldwide city search + geolocation
- `src/lib/geocode.ts` — forward + reverse geocoding, **pluggable provider**. Default: Open-Meteo
  geocoding (forward) + BigDataCloud (reverse), both no-key, pt-BR. **Both default providers are
  non-commercial / unclear for commercial use** → set `GEONAMES_USERNAME` (free, CC-BY) to switch
  both to GeoNames automatically. `src/lib/tz.ts` resolves IANA tz → UTC offset via `Intl`.
- `/api/geocode` (autocomplete) and `/api/reverse` (my-location button) routes.
- City pages `/cidade/[slug]` resolve location 3 ways: curated slug → coords from search params →
  fallback re-geocode of the slug name (so shared links work). Dynamic SSR, cached.
- `src/lib/cities.ts` — 18 curated BR cities (correct tz offsets; Amazon/Centre-West = -4) for clean
  SEO URLs; worldwide search handles everything else.

## UI (key files)
- `src/app/layout.tsx` (header + 3-col footer, metadata), `src/app/page.tsx` (home), `src/app/blog/page.tsx`.
- `src/components/Header.tsx` — single-row header: logo + search (debounced worldwide autocomplete) +
  🧭 my-location button + "Cidades populares ▾" dropdown + Blog. (Início and Previsão 7 dias removed.)
- `src/components/Icons.tsx` — inline SVG search/locate/spinner icons.
- `src/components/WeatherSections.tsx` — all weather widgets, incl. the **AgoraCard**:
  - Left: circular **temperature ring** (max|min, temp, sensação; color shifts cold→hot) + "☁️ X% de
    nuvens" badge under it.
  - Right: a **3-over-3 tile grid** — top row [Condition, Wind dial, Índice UV], bottom row
    [Sensação, Umidade, Pressão].
  - Also: `ProximasHoras` (hourly strip, "Agora" highlighted, precip fill-bars, per-hour day/night
    emoji), `RainAlert`, `SevenDay`, `AstroGrid` (Céu & Lua incl. moon phase + daylight), `Faq`, `ResumoZe`.
- Both home and city pages use AgoraCard / ProximasHoras / RainAlert. Site width: 1040px.
  Font: Plus Jakarta Sans. Brand: ink #16202b, blue #2E7BD6, light bg #f1f6fb, flat shadows.

## Status: working & verified
`tsc` clean and `next build` green at every step; all 6 verdicts, worldwide search, geolocation,
and the redesigned widgets render with live NOAA data.

## Suggested next steps
1. **Wire Anthropic Haiku** for Zé's phrases (batch + cache) — replace the `zePhrase()` stub and the
   `/api/pergunta` keyword matcher. Needs `ANTHROPIC_API_KEY` (via Firebase Secret Manager in prod).
2. Switch geocoding to a commercial-safe provider (`GEONAMES_USERNAME`) before monetizing.
3. Optional extra stat cards: dew point (ponto de orvalho) + chance of rain today.
4. SEO content engine (data-anchored daily pages per city/neighborhood — avoid "scaled content abuse").
5. Firestore caching + scheduled data/AI batch jobs; then Firebase App Hosting deploy.

## Env vars (.env.example)
`NEXT_PUBLIC_SITE_URL`, `ERDDAP_BASE`, `GFS_DATASET`, (optional) `GEONAMES_USERNAME`,
(later) `ANTHROPIC_API_KEY`.

## Note
Original design/spec: `BrasilTempo - standalone.html` (bundled prototype) and `vai-dar-brief.md`.
