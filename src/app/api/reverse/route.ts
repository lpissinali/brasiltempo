import { NextRequest, NextResponse } from 'next/server';
import { reverseGeocode, slugify } from '@/lib/geocode';

// Reverse geocoding for the "use my location" button: lat/lon → nearest city.
// The browser passes its own IANA timezone separately (it matches the user's
// location), so we only resolve the name/region/country here.
export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get('lat') || '');
  const lon = parseFloat(req.nextUrl.searchParams.get('lon') || '');
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: 'coordenadas inválidas' }, { status: 400 });
  }
  const place = await reverseGeocode(lat, lon);
  if (!place) return NextResponse.json({ error: 'não consegui achar sua cidade' }, { status: 404 });
  return NextResponse.json({
    name: place.name,
    region: place.admin1,
    country: place.country,
    countryCode: place.countryCode,
    lat: place.lat,
    lon: place.lon,
    slug: `${slugify(place.name)}-${(place.countryCode || 'xx').toLowerCase()}`,
  });
}
