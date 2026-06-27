# Zé's AI phrases (Haiku) — how it works & how to enable

Zé's funny lines can now be written by **Claude Haiku** instead of the static
pools. The design follows the brief's hard rule — *never call an LLM per visitor* —
so it's batched, cached, and free until you opt in.

## How it works
- `src/lib/phrases.ts` keeps the **static pools as the always-on fallback**, and
  adds an AI overlay: one Haiku call generates all ~16 verdict lines for a
  *scope* + day, cached in **Firestore** (`zePhrases` collection) + memory.
- `buildView` prefers an AI line per verdict when present, else the static pool.
- **Scopes (hybrid):** your 18 curated cities each get their own bucket
  (`city_<slug>`) so Zé can name the city; long-tail searched cities share one
  cheap **`global`** bucket per day.
- **Never blocks a visitor:** a cache miss serves the static pool for that one
  render and regenerates in the background; AI lines appear from the next request.

## Cost
Haiku 4.5 is $1/M input, $5/M output → **~$0.005 per generation**. Because the
app path is lazy, you only pay for cities actually visited:
- **No traffic → $0.** A few visits → a few cents.
- Pre-warming all 18 curated cities daily (cron, below) is the upper bound: ~$3/mo.

## Enable it (production)
The app uses static pools until `ANTHROPIC_API_KEY` exists — so this is fully
opt-in and safe to defer.

1. Create a **dedicated** Anthropic key (ideally its own Console **Workspace with a
   monthly spend cap** — isolates cost/limits/revocation from your other project).
2. Store secrets in Secret Manager:
   ```bash
   firebase apphosting:secrets:set ANTHROPIC_API_KEY
   firebase apphosting:secrets:set CRON_SECRET   # only if you'll use the cron route
   ```
3. **Uncomment** the two secret blocks in `apphosting.yaml` (they're ready to go).
4. Redeploy: `firebase deploy --only apphosting`.

That's it — Zé starts writing his own lines, cached per city/day.

## Optional: daily pre-warm (skip until you have traffic)
The lazy path means the day's *first* visitor to a city sees a canned line. To
give everyone AI lines all day, schedule the pre-warm route:

- Route: `GET /api/cron/phrases?key=<CRON_SECRET>` — regenerates the global set +
  all curated cities and caches them.
- Point **Cloud Scheduler** at it daily (e.g. `0 5 * * *`):
  ```bash
  gcloud scheduler jobs create http brasiltempo-zephrases \
    --schedule="0 5 * * *" --time-zone="America/Sao_Paulo" \
    --uri="https://brasiltempo.com.br/api/cron/phrases?key=YOUR_CRON_SECRET" \
    --http-method=GET
  ```
- **Don't enable this until traffic justifies it** — it generates all 18 cities
  every day (~$3/mo) regardless of visits. At low traffic the lazy path is cheaper.

## The "Pergunta o que quiser pro Zé" box
This is a **separate** AI path from the verdict-card lines. `/api/pergunta` now
calls Haiku (`src/lib/ask.ts`) to answer any free-form question — "posso correr de
tarde?", "levo o cachorro?" — using the live forecast as context, in Zé's voice.
- **Per submitted question** (not per visitor): user-initiated, so the cost model
  differs from the cards. Input is capped at 200 chars and identical questions are
  cached per city/day (`zeAnswers` collection), so repeats are free.
- Falls back to the keyword matcher when `ANTHROPIC_API_KEY` is unset or a call
  fails; the keyword card always supplies the answer's icon + accent.
- Shares the Anthropic client + JSON parsing with the phrase batch via
  `src/lib/anthropic.ts`.

## Tuning Zé's voice
Edit the `system` prompt and `POOL_BRIEF` map in `src/lib/phrases.ts`. The brief
tells Haiku what verdict each line is for; the system prompt sets the persona
(brazilian, bem-humorado, ≤70 chars, no emoji). Change the model via
`ANTHROPIC_MODEL`.
