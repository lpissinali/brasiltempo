// Shared types for BrasilTempo.
//
// The forecast object intentionally mirrors the subset of the Open-Meteo
// response shape that the original prototype consumed. The NOAA GFS layer
// (src/lib/gfs.ts) normalizes raw GFS variables INTO this shape so the verdict
// engine stays source-agnostic. Swap the data source without touching verdicts.

export interface CurrentWeather {
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: 0 | 1;
  weather_code: number;
  wind_speed_10m: number; // km/h
  wind_direction_10m: number; // degrees
  wind_gusts_10m: number; // km/h (DERIVED proxy for GFS)
  pressure_msl: number; // hPa
  cloud_cover: number; // % (DERIVED from humidity for GFS)
}

export interface HourlyWeather {
  time: string[]; // local 'YYYY-MM-DDTHH:00'
  temperature_2m: number[];
  precipitation_probability: number[]; // %
  weather_code: number[];
}

export interface DailyWeather {
  time: string[]; // 'YYYY-MM-DD', local Brazil dates
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  apparent_temperature_min: number[];
  precipitation_sum: number[]; // mm
  precipitation_probability_max: number[]; // %  (DERIVED proxy for GFS)
  uv_index_max: number[]; // DERIVED from shortwave flux for GFS
  wind_speed_10m_max: number[]; // km/h
  sunrise: string[]; // ISO-ish local
  sunset: string[];
}

export interface Forecast {
  current: CurrentWeather;
  daily: DailyWeather;
  hourly: HourlyWeather;
  /** Provenance + freshness, surfaced in the UI footer / debug. */
  source: 'noaa-gfs' | 'open-meteo';
  fetchedAt: string; // ISO
}

export interface City {
  /** name */ n: string;
  /** UF (state) */ uf: string;
  lat: number;
  lon: number;
  /** URL slug */ slug: string;
  /** UTC offset in hours (Brazil mostly -3) */ tz: number;
  /** country name (for worldwide search results) */ country?: string;
}

export interface VerdictCardData {
  key: string;
  icon: string;
  q: string; // question
  big: string; // the verdict headline
  ze: string; // Zé's funny line
  meta: string; // supporting data
  accent: string; // hex accent color
}
