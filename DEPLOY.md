# BrasilTempo — Firestore cache + Firebase App Hosting deploy

This covers the two things added in this pass: a **Firestore L2 cache** in front of
NOAA ERDDAP, and **deploying to Firebase App Hosting**. Run the commands from the
project root (`D:\Work\brasiltempo`). Firebase project: **`brasiltempo-75a7a`**.

---

## What the Firestore cache does

`src/lib/firestore.ts` is a tiny, dependency-light cache helper. `getForecast()` in
`src/lib/gfs.ts` now reads through three layers:

1. **L1 — in-memory `Map`** (per instance, fastest, dies on cold start).
2. **L2 — Firestore** (`forecastCache` collection, shared across instances, survives
   cold starts). Keyed by `lat_lon` (4 dp), 30-min TTL, same as L1.
3. **Miss → NOAA ERDDAP**, then writes back to both layers.

Why it matters: App Hosting runs with `minInstances: 0`, so instances scale to zero and
cold-start constantly — the in-memory cache alone would let almost every cold visitor
re-hit ERDDAP. Firestore gives a durable, shared cache so ERDDAP is hit at most ~once
per location per 30 min across the whole fleet.

**Graceful degradation:** with no credentials (i.e. local `npm run dev`), the Firestore
layer auto-disables and the app falls back to L1 + live ERDDAP. No Firebase setup is
needed to develop locally. Set `FIRESTORE_DISABLED=1` to force it off anywhere.

In production, `firebase-admin` picks up Application Default Credentials automatically
from the App Hosting backend's service account — no key file, no `ANTHROPIC_API_KEY`-style
secret needed for Firestore.

---

## One-time setup

### 1. Install the Firebase CLI (if needed) and log in
```bash
npm install -g firebase-tools
firebase login
```

### 2. Create the Firestore database (Native mode)
Console → Firestore Database → Create database → **Native mode** → pick a location
(e.g. `nam5` or `southamerica-east1`). Only needs doing once.

### 3. Deploy the security rules
The cache is touched only by the Admin SDK (which bypasses rules), so `firestore.rules`
denies all direct client access:
```bash
firebase deploy --only firestore:rules
```

### 4. Grant the App Hosting backend access to Firestore
The backend's service account must be able to read/write Firestore. If reads/writes fail
in prod with a permissions error, grant the Datastore User role to the App Hosting SA
(replace the SA email with the one shown in your backend's settings):
```bash
gcloud projects add-iam-policy-binding brasiltempo-75a7a \
  --member="serviceAccount:firebase-app-hosting-compute@brasiltempo-75a7a.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```
(Newer backends often have this by default — only run it if you hit `PERMISSION_DENIED`.)

---

## Deploy to App Hosting

### 5. Initialise the App Hosting backend
```bash
firebase init apphosting
```
- Choose **Use an existing project** → `brasiltempo-75a7a`.
- Create a **new backend** (or pick an existing one). You can connect a GitHub repo so
  every push to the chosen branch triggers a rollout, or deploy manually (next step).
- This adds an `apphosting` block to `firebase.json` (the Firestore block stays).

Runtime config already lives in **`apphosting.yaml`** (cpu 1, 512 MiB, min 0 / max 2,
concurrency 80, `NEXT_PUBLIC_SITE_URL`). Adjust there if needed.

### 6. Ship it
```bash
firebase deploy
# or just the backend:
firebase deploy --only apphosting
```
The adapter runs `npm run build` (`next build`) and rolls out the SSR server. The deploy
output prints the live URL.

---

## Verifying the cache in prod

After a deploy, hit a city page twice within 30 min, then check Firestore:
Console → Firestore → `forecastCache` should hold one doc per visited location, each with
`{ data: <Forecast>, ts: <epoch ms> }`. A second visit inside the TTL should serve from
cache (no new ERDDAP request).

---

## Notes / not-yet-done
- Geocoding still uses the **non-commercial** Open-Meteo/BigDataCloud defaults — set
  `GEONAMES_USERNAME` before monetizing (`src/lib/geocode.ts` switches automatically).
- The **AI phrase layer is still stubbed** (`zePhrase()` in `src/lib/phrases.ts`). When
  wired, store `ANTHROPIC_API_KEY` via Cloud Secret Manager and reference it from
  `apphosting.yaml`, and reuse this same Firestore cache for batch-generated phrases —
  never call an LLM per visitor.
- Optional next: a scheduled job to pre-warm `forecastCache` for the curated cities so
  even the first cold visitor is fast.
