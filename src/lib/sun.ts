// Deterministic sunrise/sunset using the standard NOAA solar algorithm.
// GFS provides no astronomical fields, so we compute them from date + lat/lon.
// Returns local clock times (HH:MM) given a fixed UTC offset.

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

interface SunTimes {
  sunrise: string; // 'HH:MM' local
  sunset: string; // 'HH:MM' local
  daylightMinutes: number;
  isDayNow: (utcDate: Date) => boolean;
}

// dateLocal: a Date whose Y/M/D represent the local day we want.
export function sunTimes(dateUTCmidnight: Date, lat: number, lon: number, tzOffsetHours: number): SunTimes {
  // Day of year
  const start = Date.UTC(dateUTCmidnight.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((dateUTCmidnight.getTime() - start) / 86400000);

  // Fractional year (radians)
  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1 + 0.5);

  // Equation of time (minutes)
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  // Solar declination (radians)
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  // Hour angle for sunrise/sunset (zenith 90.833°)
  const zenith = rad(90.833);
  const cosH =
    (Math.cos(zenith) - Math.sin(rad(lat)) * Math.sin(decl)) /
    (Math.cos(rad(lat)) * Math.cos(decl));

  const fmt = (minutesLocal: number): string => {
    let m = ((minutesLocal % 1440) + 1440) % 1440;
    const hh = Math.floor(m / 60);
    const mm = Math.round(m - hh * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm === 60 ? 0 : mm).padStart(2, '0')}`;
  };

  // Polar day / night fallbacks (irrelevant for Brazil but kept safe).
  if (cosH > 1) return { sunrise: '—', sunset: '—', daylightMinutes: 0, isDayNow: () => false };
  if (cosH < -1) return { sunrise: '—', sunset: '—', daylightMinutes: 1440, isDayNow: () => true };

  const ha = deg(Math.acos(cosH)); // degrees

  // UTC minutes of sunrise/sunset
  const sunriseUTC = 720 - 4 * (lon + ha) - eqTime;
  const sunsetUTC = 720 - 4 * (lon - ha) - eqTime;

  const offsetMin = tzOffsetHours * 60;
  const sunriseLocal = sunriseUTC + offsetMin;
  const sunsetLocal = sunsetUTC + offsetMin;

  return {
    sunrise: fmt(sunriseLocal),
    sunset: fmt(sunsetLocal),
    daylightMinutes: Math.round(sunsetUTC - sunriseUTC),
    isDayNow: (now: Date) => {
      const nowUTCmin = now.getUTCHours() * 60 + now.getUTCMinutes();
      return nowUTCmin >= sunriseUTC && nowUTCmin <= sunsetUTC;
    },
  };
}
