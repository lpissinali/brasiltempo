import { NextRequest, NextResponse } from 'next/server';
import { searchPlaces, slugify } from '@/lib/geocode';

// Autocomplete backend for the search box. Proxies the geocoder (keeps any
// future key server-side, adds caching, avoids CORS). Returns lightweight
// results the header can render and turn into a city-page link.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  if (q.trim().length < 2) return NextResponse.json({ results: [] });

  try {
    const places = await searchPlaces(q);
    const results = places.map((p) => ({
      name: p.name,
      region: p.admin1,
      country: p.country,
      countryCode: p.countryCode,
      lat: p.lat,
      lon: p.lon,
      timezone: p.timezone,
      slug: `${slugify(p.name)}-${p.countryCode.toLowerCase()}`,
    }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] }, { status: 200 });
  }
}
