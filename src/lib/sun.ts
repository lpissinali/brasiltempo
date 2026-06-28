// Deterministic sunrise/sunset + twilight using the standard NOAA solar
// algorithm. GFS provides no astronomical fields, so we compute them from
// date + lat/lon. Returns local clock times (HH:MM) given a fixed UTC offset.
//
// Twilight is the same calculation at a lower sun angle (zenith): civil 96°,
// nautical 102°, astronomical 108°. Day length is exposed in whole seconds too,
// so the UI can show a precise "tomorrow will be X min Y s shorter/longer".

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export interface TwilightTimes {
  civilDawn: string;
  civilDusk: string;
  nauticalDawn: string;
  nauticalDusk: string;
  astroDawn: string;
  astroDusk: string;
}

interface SunTimes {
  sunrise: string; // 'HH:MM' local
  sunset: string; // 'HH:MM' local
  daylightMinutes: number;
  daylightSeconds: number; // whole seconds, for precise day-length deltas
  twilight: TwilightTimes;
  isDayNow: (utcDate: Date) => boolean;
}

// dateUTCmidnight: a Date whose Y/M/D represent the local day we want.
export function sunTimes(dateUTCmidnight: Date, lat: number, lon: number, tzOffsetHours: number): SunTimes {
  const start = Date.UTC(dateUTCmidnight.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((dateUTCmidnight.getTime() - start) / 86400000);
  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1 + 0.5);

  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const offsetMin = tzOffsetHours * 60;

  const fmt = (minutesLocal: number): string => {
    const m = ((minutesLocal % 1440) + 1440) % 1440;
    const hh = Math.floor(m / 60);
    let mm = Math.round(m - hh * 60);
    let h = hh;
    if (mm === 60) {
      mm = 0;
      h = (hh + 1) % 24;
    }
    return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };

  // UTC minutes of rise/set for a given zenith angle, or null if it never
  // reaches that angle on this day (polar cases — irrelevant for Brazil).
  const event = (zenithDeg: number): { rise: number; set: number } | null => {
    const zenith = rad(zenithDeg);
    const cosH =
      (Math.cos(zenith) - Math.sin(rad(lat)) * Math.sin(decl)) /
      (Math.cos(rad(lat)) * Math.cos(decl));
    if (cosH > 1 || cosH < -1) return null;
    const ha = deg(Math.acos(cosH)); // degrees
    return { rise: 720 - 4 * (lon + ha) - eqTime, set: 720 - 4 * (lon - ha) - eqTime };
  };

  const sun = event(90.833); // sun's upper limb with refraction
  const civil = event(96);
  const naut = event(102);
  const astro = event(108);

  const dash = '—';
  const local = (e: { rise: number; set: number } | null, which: 'rise' | 'set'): string =>
    e ? fmt((which === 'rise' ? e.rise : e.set) + offsetMin) : dash;

  const daySec = sun ? Math.max(0, Math.round((sun.set - sun.rise) * 60)) : 0;

  return {
    sunrise: local(sun, 'rise'),
    sunset: local(sun, 'set'),
    daylightMinutes: Math.round(daySec / 60),
    daylightSeconds: daySec,
    twilight: {
      civilDawn: local(civil, 'rise'),
      civilDusk: local(civil, 'set'),
      nauticalDawn: local(naut, 'rise'),
      nauticalDusk: local(naut, 'set'),
      astroDawn: local(astro, 'rise'),
      astroDusk: local(astro, 'set'),
    },
    isDayNow: (now: Date) => {
      if (!sun) return false;
      const nowUTCmin = now.getUTCHours() * 60 + now.getUTCMinutes();
      return nowUTCmin >= sun.rise && nowUTCmin <= sun.set;
    },
  };
}
