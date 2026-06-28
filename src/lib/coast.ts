import { gunzipSync } from 'zlib';
import { COAST_MASK } from './coastmask';

// Coastal detection from coordinates alone — no per-visitor API call, works for
// ANY city worldwide (curated or searched). Backed by a global 0.1° ocean
// bitmask (src/lib/coastmask.ts). A city counts as "coastal" (beach plausible)
// when open water sits within COAST_KM of it; that's the seam the verdict engine
// uses to decide between the "praia" and the inland "rolê ao ar livre" verdict.
//
// Server-only: the mask is ~56KB gzipped and gunzipped lazily on first use. It is
// never imported by a client component, so it stays out of the browser bundle.

const { res, width, height } = COAST_MASK;

// Distance to open water for a place to still be considered a beach town. 30km
// keeps clearly-coastal cities in (Rio, Recife, Floripa) and clearly-inland ones
// out (Brasília, Goiânia, São Paulo city), validated against the source dataset.
export const COAST_KM = 30;

const EXPECTED_BYTES = (width * height) / 8;

let bits: Uint8Array | null | undefined; // undefined = not tried, null = failed
function mask(): Uint8Array | null {
  if (bits === undefined) {
    try {
      const raw = gunzipSync(Buffer.from(COAST_MASK.gzB64, 'base64'));
      // Guard against a corrupt/truncated asset: only trust a full-size mask.
      bits = raw.length === EXPECTED_BYTES ? new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength) : null;
      if (bits === null && process.env.NODE_ENV !== 'production') {
        console.warn(`[coast] mask wrong size: ${raw.length} != ${EXPECTED_BYTES}`);
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.warn('[coast] mask decode failed:', (err as Error).message);
      bits = null;
    }
  }
  return bits;
}

// Row-major, MSB-first (matches numpy.packbits). Longitude wraps at the
// antimeridian; latitude out of range is "no water".
function isOceanCell(row: number, col: number): boolean {
  const m = mask();
  if (!m || row < 0 || row >= height) return false;
  const c = ((col % width) + width) % width;
  const idx = row * width + c;
  return (m[idx >> 3] & (0x80 >> (idx & 7))) !== 0;
}

/** True when open water lies within `km` of (lat, lon). */
export function isCoastal(lat: number, lon: number, km: number = COAST_KM): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  const cosLat = Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  const dLat = km / 111;
  const dLon = km / (111 * cosLat);
  const r0 = Math.floor((lat - dLat + 90) / res);
  const r1 = Math.floor((lat + dLat + 90) / res);
  const c0 = Math.floor((lon - dLon + 180) / res);
  const c1 = Math.floor((lon + dLon + 180) / res);
  for (let r = r0; r <= r1; r++) {
    if (r < 0 || r >= height) continue;
    const cLat = -90 + (r + 0.5) * res;
    for (let c = c0; c <= c1; c++) {
      const cc = ((c % width) + width) % width;
      if (!isOceanCell(r, cc)) continue;
      const cLon = -180 + (cc + 0.5) * res;
      const dy = (cLat - lat) * 111;
      const dx = (cLon - lon) * 111 * cosLat;
      if (dx * dx + dy * dy <= km * km) return true;
    }
  }
  return false;
}
