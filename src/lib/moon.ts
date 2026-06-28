// Moon phase from date — no API needed. Based on a known new-moon epoch and the
// mean synodic month. Returns Brazilian-Portuguese phase name, emoji, and
// illuminated fraction (%). Ported from the prototype's approach.

const SYNODIC = 29.53058867; // days

const NAMES = [
  'Nova',
  'Crescente côncava',
  'Quarto crescente',
  'Crescente gibosa',
  'Cheia',
  'Minguante gibosa',
  'Quarto minguante',
  'Minguante côncava',
];
const EMOJIS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

export interface MoonInfo {
  name: string;
  emoji: string;
  illum: number; // % illuminated
  frac: number; // 0..1 through the synodic cycle (0 = new, 0.5 = full)
  waxing: boolean; // true while growing toward full
  ageDays: number; // days since the last new moon (1 decimal)
}

// --- Moonrise / moonset (approximate, ~±10 min) --------------------------
// Low-precision lunar position (Meeus abbreviated series) → altitude sampled
// across the local day; rise/set are the altitude crossings of the moon's
// standard horizon (+0.125°). Location-dependent, unlike the phase itself.

const D2R = Math.PI / 180;

function moonEquatorial(d: number): { ra: number; dec: number } {
  // d = days since J2000.0 (TT≈UT at this precision). Angles in degrees → rad.
  const L = 218.316 + 13.176396 * d; // mean longitude
  const M = 134.963 + 13.064993 * d; // moon mean anomaly
  const F = 93.272 + 13.22935 * d; // argument of latitude
  const Dm = 297.85 + 12.190749 * d; // mean elongation
  const Ms = 357.529 + 0.98560028 * d; // sun mean anomaly

  const lambda =
    (L +
      6.289 * Math.sin(M * D2R) +
      1.274 * Math.sin((2 * Dm - M) * D2R) +
      0.658 * Math.sin(2 * Dm * D2R) +
      0.214 * Math.sin(2 * M * D2R) -
      0.186 * Math.sin(Ms * D2R) -
      0.114 * Math.sin(2 * F * D2R)) *
    D2R;
  const beta =
    (5.128 * Math.sin(F * D2R) +
      0.281 * Math.sin((M + F) * D2R) -
      0.278 * Math.sin((F - M) * D2R)) *
    D2R;

  const eps = 23.4397 * D2R;
  const ra = Math.atan2(
    Math.sin(lambda) * Math.cos(eps) - Math.tan(beta) * Math.sin(eps),
    Math.cos(lambda),
  );
  const dec = Math.asin(Math.sin(beta) * Math.cos(eps) + Math.cos(beta) * Math.sin(eps) * Math.sin(lambda));
  return { ra, dec };
}

function moonAltitudeDeg(date: Date, lat: number, lon: number): number {
  const d = (date.getTime() - Date.UTC(2000, 0, 1, 12, 0, 0)) / 86400000;
  const { ra, dec } = moonEquatorial(d);
  const gmst = ((280.16 + 360.9856235 * d) % 360 + 360) % 360; // degrees
  const H = (gmst + lon) * D2R - ra; // local hour angle (rad)
  const alt = Math.asin(
    Math.sin(lat * D2R) * Math.sin(dec) + Math.cos(lat * D2R) * Math.cos(dec) * Math.cos(H),
  );
  return alt / D2R;
}

// dateUTCmidnight: a Date at UTC-midnight of the local calendar day wanted.
export function moonRiseSet(
  dateUTCmidnight: Date,
  lat: number,
  lon: number,
  tzOffsetHours: number,
): { rise: string | null; set: string | null } {
  const h0 = 0.125; // moon's standard altitude at rise/set (deg)
  const startUTC = dateUTCmidnight.getTime() - tzOffsetHours * 3600 * 1000; // local 00:00 in UTC ms
  const step = 10; // minutes

  const fmt = (localMin: number): string => {
    const m = ((localMin % 1440) + 1440) % 1440;
    const hh = Math.floor(m / 60);
    const mm = Math.round(m - hh * 60);
    const h = mm === 60 ? (hh + 1) % 24 : hh;
    return `${String(h).padStart(2, '0')}:${String(mm === 60 ? 0 : mm).padStart(2, '0')}`;
  };
  const cross = (m0: number, m1: number, a0: number, a1: number) => m0 + ((0 - a0) / (a1 - a0)) * (m1 - m0);

  let prev = moonAltitudeDeg(new Date(startUTC), lat, lon) - h0;
  let rise: number | null = null;
  let set: number | null = null;
  for (let m = step; m <= 1440; m += step) {
    const alt = moonAltitudeDeg(new Date(startUTC + m * 60000), lat, lon) - h0;
    if (rise === null && prev < 0 && alt >= 0) rise = cross(m - step, m, prev, alt);
    if (set === null && prev >= 0 && alt < 0) set = cross(m - step, m, prev, alt);
    prev = alt;
  }
  return { rise: rise !== null ? fmt(rise) : null, set: set !== null ? fmt(set) : null };
}

export function moonPhase(date = new Date()): MoonInfo {
  // Reference new moon: 2000-01-06 18:14 UTC
  const ref = Date.UTC(2000, 0, 6, 18, 14, 0);
  const days = (date.getTime() - ref) / 86400000;
  const frac = (((days % SYNODIC) + SYNODIC) % SYNODIC) / SYNODIC; // 0..1
  const idx = Math.round(frac * 8) % 8;
  const illum = Math.round(((1 - Math.cos(2 * Math.PI * frac)) / 2) * 100);
  const waxing = frac < 0.5; // growing toward full
  const ageDays = Math.round(frac * SYNODIC * 10) / 10;
  return { name: NAMES[idx], emoji: EMOJIS[idx], illum, frac, waxing, ageDays };
}
