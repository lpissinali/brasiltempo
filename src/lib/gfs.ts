import type { City, Forecast, DailyWeather, HourlyWeather } from './types';
import { deriveWeatherCode, cloudFromRH } from './sky';
import { sunTimes } from './sun';
import { getCache, setCache } from './firestore';

// ---------------------------------------------------------------------------
// NOAA GFS via PacIOOS ERDDAP — public domain, commercial use allowed, no key.
// Dataset: ncep_global (0.5°, 3-hourly, lon 0..360, ~7-day forecast horizon).
//
// GFS gives RAW physics, not a tidy forecast: temperature (K), relative
// humidity (%), precip rate (kg/m²/s ≡ mm/s), shortwave flux (W/m²), and winds
// (m/s). We normalize these into an Open-Meteo-shaped Forecast so the verdict
// engine never has to know where the numbers came from.
//
// Derived fields (documented proxies, tunable later):
//   - weather_code: from precip rate + relative humidity (no cloud var in GFS)
//   - precipitation_probability_max: from precip rate + humidity
//   - uv_index_max: from shortwave flux (dswrfsfc)
//   - apparent_temperature: light wind-chill / humidity-heat adjustment
//   - sunrise/sunset: computed astronomically (src/lib/sun.ts)
// ---------------------------------------------------------------------------

const ERDDAP_BASE = process.env.ERDDAP_BASE || 'https://pae-paha.pacioos.hawaii.edu/erddap';
const DATASET = process.env.GFS_DATASET || 'ncep_global';
const VARS = ['tmp2m', 'rh2m', 'pratesfc', 'dswrfsfc', 'ugrd10m', 'vgrd10m', 'prmslmsl'] as const;

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min — protect ERDDAP from per-visitor hits

// L1: per-instance in-memory cache (fastest, but dies on cold start).
const cache = new Map<string, { data: Forecast; ts: number }>();

// L2: Firestore cache (shared across instances, survives cold starts).
const FORECAST_COLLECTION = 'forecastCache';

function cacheKey(city: City): string {
  // Firestore doc IDs can't contain '/'. Coords (4dp) are stable per location;
  // sun/tz derivations depend only on lat/lon, so this is a safe identity.
  return `${city.lat.toFixed(4)}_${city.lon.toFixed(4)}`.replace(/\//g, '_');
}

interface Step {
  utc: Date;
  localDate: string; // YYYY-MM-DD in city tz
  localHour: number; // 0..23 in city tz
  tC: number;
  rh: number;
  rateMmH: number;
  accMm: number; // mm accumulated over the 3h step
  dswrf: number;
  windKmh: number;
  windDir: number; // degrees (meteorological, "from")
  gustKmh: number;
  pressureHpa: number;
  cloudPct: number;
  pop: number; // derived precipitation probability for this step
}

function to360(lon: number): number {
  return ((lon % 360) + 360) % 360;
}

function snap(v: number): number {
  // snap to the 0.5° grid
  return Math.round(v * 2) / 2;
}

function localDateString(utc: Date, tzHours: number): string {
  const shifted = new Date(utc.getTime() + tzHours * 3600 * 1000);
  return shifted.toISOString().slice(0, 10);
}

function apparentTemp(tC: number, rh: number, windKmh: number): number {
  if (tC <= 14) return tC - Math.min(6, windKmh * 0.08); // light wind chill
  if (tC >= 27) return tC + Math.max(0, ((rh - 50) / 100) * (tC - 27) * 0.7); // humidity heat
  return tC;
}

function stepPop(rateMmH: number, rh: number): number {
  let p = 0;
  if (rateMmH >= 0.05) p = Math.min(95, 40 + rateMmH * 15);
  const hp = rh >= 80 ? ((rh - 80) / 20) * 55 : 0;
  return Math.max(p, hp);
}

function uvFromFlux(dswrf: number): number {
  // Empirical proxy: peak summer flux (~950 W/m²) ≈ UV index ~12.
  return Math.max(0, Math.min(13, dswrf * 0.0125));
}

function buildUrl(lat: number, lon: number, startISO: string, endISO: string): string {
  const gridLon = snap(to360(lon)) % 360; // wrap 360.0 back to 0.0 (grid is 0..359.5)
  const sel = `[(${startISO}):(${endISO})][(${snap(lat)})][(${gridLon})]`;
  const query = VARS.map((v) => `${v}${sel}`).join(',');
  return `${ERDDAP_BASE}/griddap/${DATASET}.json?${encodeURI(query)}`;
}

async function fetchRows(lat: number, lon: number, days: number): Promise<any[][]> {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const end = new Date(start.getTime() + days * 86400 * 1000);
  const url = buildUrl(lat, lon, start.toISOString().replace('.000', ''), end.toISOString().replace('.000', ''));
  const res = await fetch(url, {
    // Next.js data cache as a second layer; module cache is the primary guard.
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`ERDDAP ${res.status}`);
  const json = await res.json();
  return json.table.rows as any[][];
}

async function fetchRowsWithFallback(lat: number, lon: number): Promise<any[][]> {
  // Forecast horizon drifts; try a wide window, shrink if ERDDAP rejects it.
  for (const days of [7, 6, 5, 3]) {
    try {
      const rows = await fetchRows(lat, lon, days);
      if (rows && rows.length) return rows;
    } catch {
      // try a shorter window
    }
  }
  throw new Error('NOAA GFS unavailable for this location');
}

function parseSteps(rows: any[][], tzHours: number): Step[] {
  // Cols: time, lat, lon, tmp2m, rh2m, pratesfc, dswrfsfc, ugrd10m, vgrd10m, prmslmsl
  return rows.map((r) => {
    const utc = new Date(r[0]);
    const tmpK = Number(r[3]);
    const rh = Number(r[4]);
    const prate = Number(r[5]); // kg/m²/s == mm/s
    const dswrf = Number(r[6]);
    const u = Number(r[7]);
    const v = Number(r[8]);
    const pres = Number(r[9]); // Pa (or hPa for some datasets)
    const rateMmH = prate * 3600;
    const windKmh = Math.sqrt(u * u + v * v) * 3.6;
    const shifted = new Date(utc.getTime() + tzHours * 3600 * 1000);
    return {
      utc,
      localDate: localDateString(utc, tzHours),
      localHour: shifted.getUTCHours(),
      tC: tmpK - 273.15,
      rh,
      rateMmH,
      accMm: prate * 10800, // 3h
      dswrf,
      windKmh,
      // meteorological wind direction (the direction the wind comes FROM)
      windDir: (Math.atan2(-u, -v) * 180) / Math.PI + 360,
      gustKmh: windKmh * 1.4, // GFS gust field absent → proxy from sustained wind
      pressureHpa: pres > 2000 ? pres / 100 : pres,
      cloudPct: cloudFromRH(rh),
      pop: stepPop(rateMmH, rh),
    };
  });
}

function normalize(city: City, steps: Step[]): Forecast {
  const now = new Date();

  // Group by local date, preserving order.
  const byDay = new Map<string, Step[]>();
  for (const s of steps) {
    if (!byDay.has(s.localDate)) byDay.set(s.localDate, []);
    byDay.get(s.localDate)!.push(s);
  }
  const dates = Array.from(byDay.keys()).sort();

  const daily: DailyWeather = {
    time: [],
    weather_code: [],
    temperature_2m_max: [],
    temperature_2m_min: [],
    apparent_temperature_min: [],
    precipitation_sum: [],
    precipitation_probability_max: [],
    uv_index_max: [],
    wind_speed_10m_max: [],
    sunrise: [],
    sunset: [],
  };

  for (const d of dates) {
    const day = byDay.get(d)!;
    const temps = day.map((s) => s.tC);
    const appTemps = day.map((s) => apparentTemp(s.tC, s.rh, s.windKmh));
    const dayMaxRate = Math.max(...day.map((s) => s.rateMmH));
    // representative humidity near peak sun (highest flux step)
    const peakStep = day.reduce((a, b) => (b.dswrf > a.dswrf ? b : a), day[0]);

    daily.time.push(d);
    daily.weather_code.push(deriveWeatherCode({ rateMmH: dayMaxRate, rh: peakStep.rh }));
    daily.temperature_2m_max.push(Math.max(...temps));
    daily.temperature_2m_min.push(Math.min(...temps));
    daily.apparent_temperature_min.push(Math.min(...appTemps));
    daily.precipitation_sum.push(day.reduce((sum, s) => sum + s.accMm, 0));
    daily.precipitation_probability_max.push(Math.round(Math.max(...day.map((s) => stepPop(s.rateMmH, s.rh)))));
    daily.uv_index_max.push(uvFromFlux(Math.max(...day.map((s) => s.dswrf))));
    daily.wind_speed_10m_max.push(Math.max(...day.map((s) => s.windKmh)));

    const [yy, mm, dd] = d.split('-').map(Number);
    const st = sunTimes(new Date(Date.UTC(yy, mm - 1, dd)), city.lat, city.lon, city.tz);
    daily.sunrise.push(`${d}T${st.sunrise}`);
    daily.sunset.push(`${d}T${st.sunset}`);
  }

  // Current = step nearest to now.
  const cur = steps.reduce((a, b) =>
    Math.abs(b.utc.getTime() - now.getTime()) < Math.abs(a.utc.getTime() - now.getTime()) ? b : a,
  );
  const todayDate = dates[0];
  const [ty, tm, td] = todayDate.split('-').map(Number);
  const todaySun = sunTimes(new Date(Date.UTC(ty, tm - 1, td)), city.lat, city.lon, city.tz);
  const isDay = todaySun.isDayNow(now) ? 1 : 0;

  // --- Hourly series: linear interpolation of the 3-hourly steps to 1-hour
  // resolution, from the current step forward ~24h (GFS is natively 3-hourly). ---
  const hourly: HourlyWeather = { time: [], temperature_2m: [], precipitation_probability: [], weather_code: [] };
  const ordered = [...steps].sort((a, b) => a.utc.getTime() - b.utc.getTime());
  const startIdx = Math.max(0, ordered.findIndex((s) => s.utc.getTime() >= now.getTime() - 3 * 3600 * 1000));
  for (let i = startIdx; i < ordered.length - 1 && hourly.time.length < 24; i++) {
    const a = ordered[i];
    const b = ordered[i + 1];
    const spanH = Math.round((b.utc.getTime() - a.utc.getTime()) / 3600000) || 3;
    for (let h = 0; h < spanH && hourly.time.length < 24; h++) {
      const f = h / spanH;
      const t = new Date(a.utc.getTime() + h * 3600000);
      const localH = (a.localHour + h) % 24;
      const localD = localDateString(t, city.tz);
      hourly.time.push(`${localD}T${String(localH).padStart(2, '0')}:00`);
      hourly.temperature_2m.push(a.tC + (b.tC - a.tC) * f);
      hourly.precipitation_probability.push(Math.round(a.pop + (b.pop - a.pop) * f));
      hourly.weather_code.push(deriveWeatherCode({ rateMmH: a.rateMmH + (b.rateMmH - a.rateMmH) * f, rh: a.rh }));
    }
  }

  return {
    current: {
      temperature_2m: cur.tC,
      relative_humidity_2m: cur.rh,
      apparent_temperature: apparentTemp(cur.tC, cur.rh, cur.windKmh),
      is_day: isDay,
      weather_code: deriveWeatherCode({ rateMmH: cur.rateMmH, rh: cur.rh }),
      wind_speed_10m: cur.windKmh,
      wind_direction_10m: cur.windDir % 360,
      wind_gusts_10m: cur.gustKmh,
      pressure_msl: cur.pressureHpa,
      cloud_cover: cur.cloudPct,
    },
    daily,
    hourly,
    source: 'noaa-gfs',
    fetchedAt: new Date().toISOString(),
  };
}

export async function getForecast(city: City): Promise<Forecast> {
  const key = cacheKey(city);

  // L1 — in-memory (per instance, fastest).
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return hit.data;

  // L2 — Firestore (shared, survives cold starts). No-ops to null locally.
  const cached = await getCache<Forecast>(FORECAST_COLLECTION, key, CACHE_TTL_MS);
  if (cached) {
    cache.set(key, { data: cached, ts: Date.now() });
    return cached;
  }

  // Miss — hit NOAA ERDDAP, then populate both cache layers.
  const rows = await fetchRowsWithFallback(city.lat, city.lon);
  const steps = parseSteps(rows, city.tz);
  const data = normalize(city, steps);

  cache.set(key, { data, ts: Date.now() });
  // Await so the durable write reliably lands before the instance can freeze;
  // its latency is negligible next to the ERDDAP fetch we just did, and
  // setCache swallows its own errors so this never breaks the response.
  await setCache(FORECAST_COLLECTION, key, data);

  return data;
}
