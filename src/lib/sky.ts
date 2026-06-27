// Weather-code → emoji/label map, ported verbatim from the prototype (WMO codes).
// Plus a derivation that turns raw GFS fields into a WMO-ish code, since GFS has
// no weather_code. The verdict engine and UI read weather_code as before.

export interface Sky {
  emoji: string;
  label: string;
}

export function skyMap(code: number | null | undefined, isDay: number | undefined): Sky {
  const c = code == null ? 3 : code;
  const day = isDay !== 0;
  if (c === 0) return { emoji: day ? '☀️' : '🌙', label: 'Céu limpo' };
  if (c === 1) return { emoji: day ? '🌤️' : '🌙', label: 'Quase limpo' };
  if (c === 2) return { emoji: '⛅', label: 'Parcialmente nublado' };
  if (c === 3) return { emoji: '☁️', label: 'Nublado' };
  if (c >= 45 && c <= 48) return { emoji: '🌫️', label: 'Neblina' };
  if (c >= 51 && c <= 57) return { emoji: '🌦️', label: 'Garoa' };
  if (c >= 61 && c <= 67) return { emoji: '🌧️', label: 'Chuva' };
  if (c >= 71 && c <= 77) return { emoji: '❄️', label: 'Neve' };
  if (c >= 80 && c <= 82) return { emoji: '🌦️', label: 'Pancadas' };
  if (c >= 95) return { emoji: '⛈️', label: 'Tempestade' };
  return { emoji: '☁️', label: 'Nublado' };
}

/**
 * Derive a WMO-ish weather code from GFS-available fields.
 *
 * GFS gives no cloud-cover or weather classification, so we infer:
 *  - Precipitation class from precip rate (mm/h).
 *  - "Cloudiness" from relative humidity as a proxy (GFS rh2m), refined by how
 *    far observed shortwave flux falls below the clear-sky maximum when known.
 *
 * This is a documented proxy, intended to be good enough for the verdicts and
 * tunable later (or replaced by ensemble/cloud products).
 */
export function deriveWeatherCode(opts: {
  rateMmH: number; // precip rate, mm/h
  rh: number; // relative humidity %
  clearness?: number; // 0..1, observed/clear-sky shortwave (optional, daytime)
}): number {
  const { rateMmH, rh } = opts;

  // Precipitation dominates.
  if (rateMmH >= 4) return 65; // heavy rain
  if (rateMmH >= 1) return 63; // rain
  if (rateMmH >= 0.2) return 61; // light rain
  if (rateMmH >= 0.05) return 51; // drizzle

  // Otherwise classify cloudiness.
  const clearness = opts.clearness;
  if (clearness != null && clearness > 0) {
    if (clearness >= 0.82) return 0; // clear
    if (clearness >= 0.6) return 1; // mostly clear
    if (clearness >= 0.4) return 2; // partly cloudy
    return 3; // overcast
  }

  // Night / no-flux fallback: use humidity.
  if (rh < 65) return 0;
  if (rh < 78) return 1;
  if (rh < 90) return 2;
  return 3;
}

// GFS has no cloud-cover field; approximate from relative humidity.
export function cloudFromRH(rh: number): number {
  return Math.max(0, Math.min(100, Math.round((rh - 35) * 1.55)));
}

const COMPASS = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
export function degToCompass(deg: number): string {
  return COMPASS[Math.round(((deg % 360) / 45)) % 8];
}
