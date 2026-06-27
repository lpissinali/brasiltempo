// ---------------------------------------------------------------------------
// Firestore — shared, persistent cache (L2) for expensive upstream calls.
//
// WHY: App Hosting runs the Next SSR server with `minInstances: 0`, so instances
// scale to zero and cold-start fresh. The in-memory Map in gfs.ts (L1) is per
// instance and dies on every cold start, which means every cold visitor would
// otherwise re-hit NOAA ERDDAP. Firestore gives a cache that survives cold
// starts AND is shared across the (up to maxInstances) running instances.
//
// CREDENTIALS: In production on Firebase App Hosting, firebase-admin picks up
// Application Default Credentials automatically (the backend's service account),
// so no key file is needed. Locally, there are usually no credentials — so this
// module is written to DEGRADE GRACEFULLY: if init fails or no project is
// resolvable, every cache op becomes a no-op and the caller falls back to the
// live fetch. `npm run dev` keeps working with zero Firebase setup.
//
// To force-disable Firestore (e.g. a local run that somehow has ADC), set
// FIRESTORE_DISABLED=1.
// ---------------------------------------------------------------------------

import type { Firestore } from 'firebase-admin/firestore';

interface CacheEnvelope<T> {
  data: T;
  ts: number; // epoch ms when written
}

let dbPromise: Promise<Firestore | null> | null = null;

// Resolve the GCP/Firebase project id from whatever the environment exposes.
// App Hosting / Cloud Run set GCLOUD_PROJECT or GOOGLE_CLOUD_PROJECT; we also
// allow an explicit override for clarity.
function resolveProjectId(): string | undefined {
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.GCP_PROJECT ||
    undefined
  );
}

async function getDb(): Promise<Firestore | null> {
  if (process.env.FIRESTORE_DISABLED === '1') return null;
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    try {
      const { getApps, initializeApp, applicationDefault } = await import('firebase-admin/app');
      const { getFirestore } = await import('firebase-admin/firestore');

      const projectId = resolveProjectId();

      const app =
        getApps()[0] ??
        initializeApp({
          // applicationDefault() uses the backend SA in prod; throws locally if
          // no ADC — which we catch below and fall back to no-op caching.
          credential: applicationDefault(),
          ...(projectId ? { projectId } : {}),
        });

      const db = getFirestore(app);
      // ignoreUndefinedProperties keeps writes from throwing on optional fields.
      try {
        db.settings({ ignoreUndefinedProperties: true });
      } catch {
        // settings() throws if called twice; safe to ignore.
      }
      return db;
    } catch (err) {
      // No credentials / not configured → run without the L2 cache.
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[firestore] disabled (no credentials/init failed):', (err as Error).message);
      }
      return null;
    }
  })();

  return dbPromise;
}

/** True when Firestore is reachable in this environment. */
export async function firestoreReady(): Promise<boolean> {
  return (await getDb()) !== null;
}

/**
 * Read a cached value if present and fresher than `ttlMs`.
 * Returns null on miss, stale, or any Firestore error (never throws).
 */
export async function getCache<T>(collection: string, doc: string, ttlMs: number): Promise<T | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const snap = await db.collection(collection).doc(doc).get();
    if (!snap.exists) return null;
    const env = snap.data() as CacheEnvelope<T> | undefined;
    if (!env || typeof env.ts !== 'number') return null;
    if (Date.now() - env.ts > ttlMs) return null;
    return env.data;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[firestore] getCache failed:', (err as Error).message);
    }
    return null;
  }
}

/**
 * Write a value into the cache with the current timestamp.
 * Best-effort: swallows errors so a Firestore hiccup never breaks a response.
 */
export async function setCache<T>(collection: string, doc: string, data: T): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const env: CacheEnvelope<T> = { data, ts: Date.now() };
    await db.collection(collection).doc(doc).set(env);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[firestore] setCache failed:', (err as Error).message);
    }
  }
}
