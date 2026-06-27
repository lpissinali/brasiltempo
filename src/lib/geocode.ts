import type { City } from './types';
import { offsetHoursForZone } from './tz';

// Worldwide geocoding for the search box.
//
// Provider is pluggable. Default: Open-Meteo geocoding (no key, great pt-BR
// names, returns IANA timezone). For commercial scale, set GEONAMES_USERNAME to
// switch to GeoNames (free account, CC-BY) — or self-host Photon/Nominatim and
// point GEOCODER_BASE at it. The rest of the app only sees the Place shape.

export interface Place {
  id: string;
  name: string;
  admin1?: string; // state / region
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  timezone: string; // IANA
  population?: number;
}

const cache = new Map<string, { data: Place[]; ts: number }>();
const TTL = 60 * 60 * 1000; // 1h

export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function placeToCity(p: Place): City {
  return {
    n: p.name,
    uf: p.admin1 || p.country,
    country: p.country,
    lat: p.lat,
    lon: p.lon,
    slug: `${slugify(p.name)}-${p.countryCode.toLowerCase()}`,
    tz: offsetHoursForZone(p.timezone),
  };
}

async function searchOpenMeteo(q: string): Promise<Place[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=pt&format=json`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`geocoding ${res.status}`);
  const json = await res.json();
  const results = (json.results || []) as any[];
  return results.map((r) => ({
    id: String(r.id),
    name: r.name,
    admin1: r.admin1,
    country: r.country,
    countryCode: r.country_code,
    lat: r.latitude,
    lon: r.longitude,
    timezone: r.timezone || 'UTC',
    population: r.population,
  }));
}

async function searchGeoNames(q: string, username: string): Promise<Place[]> {
  const url = `http://api.geonames.org/searchJSON?q=${encodeURIComponent(q)}&maxRows=8&featureClass=P&orderby=population&lang=pt&username=${encodeURIComponent(username)}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`geonames ${res.status}`);
  const json = await res.json();
  const results = (json.geonames || []) as any[];
  return results.map((r) => ({
    id: String(r.geonameId),
    name: r.name,
    admin1: r.adminName1,
    country: r.countryName,
    countryCode: r.countryCode,
    lat: Number(r.lat),
    lon: Number(r.lng),
    timezone: r.timezone?.timeZoneId || 'UTC',
    population: r.population,
  }));
}

// Reverse geocoding (lat/lon → nearest place) for the "use my location" button.
// Default: BigDataCloud reverse-geocode-client (no key, pt-BR names). The caller
// supplies the timezone from the browser (it's the user's own location), so this
// only needs to resolve a nice name + region + country.
export async function reverseGeocode(lat: number, lon: number): Promise<Omit<Place, 'timezone'> | null> {
  const geonamesUser = process.env.GEONAMES_USERNAME;
  try {
    if (geonamesUser) {
      const url = `http://api.geonames.org/findNearbyPlaceNameJSON?lat=${lat}&lng=${lon}&lang=pt&username=${encodeURIComponent(geonamesUser)}`;
      const res = await fetch(url, { cache: 'no-store' });
      const json = await res.json();
      const g = (json.geonames || [])[0];
      if (g) {
        return { id: String(g.geonameId), name: g.name, admin1: g.adminName1, country: g.countryName, countryCode: g.countryCode, lat, lon };
      }
      return null;
    }
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`;
    const res = await fetch(url, { cache: 'no-store' });
    const d = await res.json();
    // `city` can be a metro region ("Região Metropolitana de…"); prefer the
    // locality name in that case.
    let name = d.city || d.locality || '';
    if (/regi[ãa]o|metropolit/i.test(name) && d.locality) name = d.locality;
    if (!name) name = d.locality || d.principalSubdivision || 'Sua localização';
    return {
      id: `${lat},${lon}`,
      name,
      admin1: d.principalSubdivision || undefined,
      country: d.countryName || '',
      countryCode: d.countryCode || '',
      lat,
      lon,
    };
  } catch {
    return null;
  }
}

export async function searchPlaces(q: string): Promise<Place[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  const key = query.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;

  let data: Place[] = [];
  const geonamesUser = process.env.GEONAMES_USERNAME;
  try {
    data = geonamesUser ? await searchGeoNames(query, geonamesUser) : await searchOpenMeteo(query);
  } catch {
    data = [];
  }
  cache.set(key, { data, ts: Date.now() });
  return data;
}
