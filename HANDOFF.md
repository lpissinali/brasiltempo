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

---

# UPDATE — Session 2 (June 2026). This supersedes "Status" / "Next steps" above.

## Now LIVE & deployed (Firebase App Hosting, project `brasiltempo-75a7a`)
- **Domain:** `brasiltempo.com.br` (apex canonical) + `www` → 301 → apex. Also on
  `https://brasiltempo--brasiltempo-75a7a.us-central1.hosted.app`. Deploy:
  `firebase deploy --only apphosting`. Config in `firebase.json`, `.firebaserc`, `apphosting.yaml`.
- **Firestore cache (L2):** `src/lib/firestore.ts` — lazy firebase-admin (ADC in prod,
  no-ops locally). `getForecast` is L1 mem → L2 Firestore (`forecastCache`, 30 min) → ERDDAP.
  Rules in `firestore.rules` deny all client access (Admin SDK only). Confirmed writing in prod.
- **Runtime:** Node 22 (`engines` + apphosting runtime).

## AI is wired (Anthropic Haiku) — `ANTHROPIC_API_KEY` secret set via Secret Manager
- **Shared client:** `src/lib/anthropic.ts` (`anthropicText`, `extractJsonObject`, `brDayKey`).
  Model via `ANTHROPIC_MODEL` (default `claude-haiku-4-5-20251001`).
- **Verdict-card phrases:** `src/lib/phrases.ts`. Static pools are the always-on FALLBACK;
  Haiku generates all lines per scope/day, cached in Firestore (`zePhrases`) + memory.
  Hybrid scope: per-city for the 18 curated cities (`city_<slug>`), `global` for long-tail.
  Non-blocking: cache miss serves pool + regenerates in background. Off when no API key.
  `buildView(city, forecast, phrases)` prefers AI line per pool, else pool. `roupa` pool removed.
- **Free-question box ("Pergunta o que quiser"):** `src/lib/ask.ts` + `/api/pergunta`.
  Per-question Haiku call reads the live forecast; **detects a city named in the question**,
  geocodes it and answers for THAT city (one-call redirect via `{city:"..."}`); else uses the
  page's city. Off-topic questions get a playful answer + neutral 💬 icon (`offtopic` flag).
  Length-capped (200), word-boundary `clip()`, cached per question/page/day (`zeAnswers`).
- **Optional cron pre-warm:** `/api/cron/phrases?key=<CRON_SECRET>` (unwired; `CRON_SECRET`
  commented in apphosting.yaml). Only worth scheduling once there's steady traffic.
- **Cost:** Haiku 4.5 = $1/M in, $5/M out (~$0.005/generation). Lazy ⇒ ~$0 at low traffic.
- **Setup notes:** `AI-PHRASES.md`, deploy/domain in `DEPLOY.md` / `DOMAIN-SETUP.md`.
  Local AI testing: put `ANTHROPIC_API_KEY` in `.env.local` (gitignored), restart dev.

## Data correctness fix (important)
`src/lib/gfs.ts` now drops local days before "today" — the GFS window opens at UTC-midnight,
which is *yesterday evening* in Brazil's tz, so `daily[0]` was a partial yesterday. This was
collapsing today's max/min and making "vai chover amanhã" read TODAY. Fixed for all tz.

## UI changes this session
- **Verdict cards:** show the 2–3 most relevant (relevance score in `verdicts.ts`,
  `v.cards`); `v.allCards` keeps all 5 for the question box. Refined card visuals.
- **Céu & Lua (`AstroGrid` in `WeatherSections.tsx`):** drawn **SVG moon** (real illumination
  + waxing/waning, **hemisphere-correct** via `city.lat<0`), **moonrise/moonset** (approx
  ±10 min, `moonRiseSet` in `moon.ts`), **twilight** (civil/nautical/astronomical) and precise
  **"amanhã será X min Y s mais curto/longo"** (`sky` object; twilight + `daylightSeconds` in
  `sun.ts`). NOTE: moon **phase/illumination is identical worldwide** (physically correct) —
  only orientation + rise/set times differ by location.
- **City page (`/cidade/[slug]`):** question box moved to top; 7-day forecast restyled as a
  horizontal strip matching "Próximas horas" (today highlighted) and moved up.

## Verification caveat
The Linux sandbox mounts the project read-stale, so full `next build`/`tsc` can't run there.
All changes were typechecked in isolated harnesses against the real types + runtime-tested.
**Run `npm run typecheck && npm run build` on Windows before each deploy.**

## Still open / next ideas
- Switch geocoding to GeoNames (`GEONAMES_USERNAME`) — last commercial-safety item.
- Optional: upcoming moon-phase calendar (Nova/Cheia dates), dew-point card, SEO content engine,
  schedule the phrase cron once traffic grows.

---

# UPDATE — Session 3 (June 2026). This supersedes the sections above where they conflict.

## Brand: the "Zé do Tempo" mascot was DROPPED
- No named mascot anymore. All user-facing copy speaks as the brand — "o BrasilTempo" / "a gente".
  (The "What it is" section at the very top is now outdated re: the mascot; the voice/personality
  stays, just no character name.)
- AI persona prompts in `src/lib/ask.ts` and `src/lib/phrases.ts` were rewritten to forbid a name
  ("Você é a voz do BrasilTempo … nunca use um nome próprio nem se refira a um mascote").
- INTERNAL identifiers were intentionally left as-is (`zePhrase`, `getZePhrases`, `ZeAnswer`,
  `ResumoZe`, `zePhrases`/`zeAnswers` Firestore collections) — invisible to users, not worth the churn.

## Logo + favicons + OG (official artwork)
- `src/components/Logo.tsx` = the official **bare symbol** (golden sun + rays over blue waves,
  transparent) used in the header/footer lockup with `Wordmark`.
- Favicons via Next file conventions (auto-wired, no manual <link>): `src/app/icon.svg` (blue app
  tile, white waves), `src/app/favicon.ico` (16/32/48), `src/app/apple-icon.png` (180, flattened on
  blue). PWA: `public/icon-192.png`, `public/icon-512.png` + `src/app/manifest.ts`.
- `public/og.png` (1200×630) = official lockup on the brand light bg. Source art in
  `Brasiltempo logo ideas.zip/export/*` (symbol.svg, lockup.svg). Raster icons were generated from
  the official SVG geometry (cairosvg) — if you tweak the art, regenerate these.

## Metadata + SEO foundation (NEW)
- `src/app/sitemap.ts` — dynamic: home, `/blog`, all curated cities, blog posts, legal pages.
- `src/app/robots.ts` — allow all, disallow `/api/`, points to sitemap + canonical host.
- `src/components/JsonLd.tsx` — server-rendered JSON-LD + helpers: `websiteSchema` (+Organization
  logo), `breadcrumbSchema`, `faqSchema`, `articleSchema`, `webPageSchema`, `blogIndexSchema`.
  Wired into home (WebSite), city pages (Breadcrumb+FAQ), blog index (Breadcrumb+Blog), blog posts
  (Breadcrumb+BlogPosting+FAQ), legal pages (Breadcrumb+WebPage).
- Canonicals via `alternates.canonical` on home/city/blog/legal. Root metadata has OG image
  (`/og.png`), Twitter `summary_large_image`, `themeColor`, `applicationName`, `keywords`,
  `formatDetection`, and the **AdSense verification meta** (`other['google-adsense-account'] =
  'ca-pub-4831931651277615'`). City + blog-post `openGraph` re-declare `images: ['/og.png']`
  (Next shallow-merges openGraph, so children must repeat it).
- **Indexing policy:** curated cities = indexable + in sitemap; **long-tail searched cities
  (`/cidade/[slug]?lat=…`) are `noindex, follow`** (in `generateMetadata`, keyed off
  `getCityBySlug`). This is the scaled-content-abuse guard — keep it.

## Blog (real content now) + legal pages
- `src/lib/posts.tsx` — registry of 3 evergreen pt-BR articles (`Body: () => JSX.Element`):
  `como-saber-se-vai-chover`, `o-que-e-indice-uv`, `previsao-7-dias-confiavel`. Add posts by
  appending here; sitemap/index/route all read from it.
- `src/app/blog/[slug]/page.tsx` — SSG (`generateStaticParams`, `dynamicParams=false`),
  canonical + Article/Breadcrumb/FAQ JSON-LD, "continue lendo". `.article` prose style in
  `globals.css`.
- `src/app/privacidade`, `/cookies`, `/termos` — real baseline pt-BR pages (LGPD, cookies/AdSense,
  no-warranty). **Get a lawyer to review before serious commercial use.** Linked in the footer
  "Institucional" column.
- Footer refactored (`layout.tsx`): dropped "Perguntas"; "Cidades populares" (`POPULAR`, 8) +
  "Institucional". Home page has an expanded pre-footer SEO `.article` section with internal links.
- `SevenDay` (WeatherSections) is now a **vertical list with min→max temp range bars** (distinct
  from the `ProximasHoras` horizontal strip).

## Coastal-aware weekend verdict (NEW)
- `src/lib/coastmask.ts` — global 0.1° ocean bitmask (gzip+base64, ~56KB, generated from the
  `global-land-mask` dataset). `src/lib/coast.ts` `isCoastal(lat,lon)` = open water within 30km
  (lazy gunzip, server-only, size-guarded).
- `verdicts.ts`: coastal cities keep the **praia** verdict; inland cities get a generic **"rolê ao
  ar livre"** verdict (new pools `outBora/outArr/outCasa` in `phrases.ts`). Works for any city by
  coordinates — no more "vai pra praia" in Brasília.

## Cities: 18 → 101 (data-driven)
- `src/lib/cities.ts` rewritten: `RAW: [name, uf, lat, lon][]`, **tz derived from UF** (AC=-5;
  AM/RR/RO/MT/MS=-4; else -3), slug generated. First 27 = capitals, then ~74 most populous.
- Exports: `CITIES`, `CAPITALS` (first 27), `POPULAR` (first 8), `DEFAULT_CITY` (São Paulo, the
  home page default — kept on purpose), `getCityBySlug`. Coords are ~2-decimal (fine for the 0.5°
  grid; fix individual ones if a forecast looks off).

## Question box rework (`/api/pergunta`, `ask.ts`, `national.ts`, `FreeQuestionBox.tsx`)
- **Icon follows the ANSWER, and is optional.** Haiku returns a `topic`
  (chuva/sol/calor/frio/vento/umidade/praia/uv or ""); `TOPIC_ICON` maps it; off-topic/empty = no
  icon. (Old behavior keyword-guessed and always showed rain.)
- **Nationwide questions** (`NATIONAL_RE`): `src/lib/national.ts` `nationalSnapshot()` feeds the
  **27 capitals'** current temps to Haiku (cached 30min); answers cached under a shared `national`
  scope. Bounded to capitals so a cold snapshot is ≤27 fetches (NOT the full 101).
- **Named city** → answers inline + a "Ver previsão completa de {cidade} →" link (`citySlug` stored
  in the cached answer so it survives cache hits). No forced redirect.
- **No-AI fallback upgraded** (matters: with a bad/missing key everything falls here): detects a
  named curated city (whole-word, accent-insensitive, ambiguous-name denylist incl. natal/serra/
  vitoria/santos), handles **temperature** questions (daily max/min range + 🌡️), shows the city link.
- Box subtitle states scope: "Sobre {cidade} — ou cite outra cidade, ou pergunte do Brasil todo."

## Analytics + AdSense
- GA4: `src/components/Analytics.tsx` (next/script, **production-only**, id from `NEXT_PUBLIC_GA_ID`
  = `G-JXFL7E2XRS`, set in `apphosting.yaml` BUILD+RUNTIME and `.env.example`).
- Custom events via `src/lib/track.ts` (no-op when gtag absent): `pergunta_enviada`,
  `cidade_buscada`, `localizacao_usada`, `cidade_link_clicado`. In GA, register the params
  (`cidade`, `uf`, …) as event-scoped **custom dimensions** to segment, and mark events as Key Events.
  Also link Search Console + AdSense in GA Admin → Product links.
- AdSense site verification meta tag added (see Metadata section).

## Rendering / freshness (IMPORTANT)
- The home page (`src/app/page.tsx`) is **`export const dynamic = 'force-dynamic'`** — it must render
  per request so the clock-sensitive UI ("Agora" / "Próximas horas") stays current. Do NOT put it
  back on `revalidate`/ISR: that froze the rendered time at deploy for hours (App Hosting served the
  stale snapshot). Freshness is safe because `getForecast` has its own 30-min cache (mem + Firestore),
  so per-request render is cheap and doesn't re-hit NOAA.
- City pages are already dynamic (they read `searchParams`), so they weren't affected.

## ⚠️ Build/deploy gotcha (READ THIS)
- The agent sandbox mount **truncates files on read intermittently**, so `tsc`/`next build` there
  produce phantom errors AND it once tricked the agent into deleting a still-used `import Link`
  (broke a Cloud Build). **Always run `npm run typecheck && npm run build` on Windows before
  `firebase deploy --only apphosting`.** Don't trust an in-sandbox build.

## Still open / next ideas (updated)
- Switch geocoding to GeoNames (`GEONAMES_USERNAME`) — last commercial-safety item before monetizing.
- Lawyer review of `/privacidade`, `/cookies`, `/termos`.
- GA: register custom dimensions, mark Key Events, link Search Console + AdSense; consider an LGPD
  cookie-consent banner (GA loads unconditionally today).
- Optional: dew-point card, moon-phase calendar, more blog posts, fix any off coordinates in the
  100-city list, schedule the phrase cron once traffic grows.
