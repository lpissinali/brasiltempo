import type { City } from './types';

// Curated Brazilian cities — pre-rendered with clean slugs for SEO. Worldwide
// search (any city) is handled dynamically via geocoding; see lib/geocode.ts.
// tz is the fixed UTC offset (Brazil has no DST since 2019). Most of Brazil is
// -3; the Amazon/Centre-West states are -4; Acre is -5.
export const CITIES: City[] = [
  { n: 'São Paulo', uf: 'SP', lat: -23.55, lon: -46.63, slug: 'sao-paulo-sp', tz: -3 },
  { n: 'Rio de Janeiro', uf: 'RJ', lat: -22.91, lon: -43.17, slug: 'rio-de-janeiro-rj', tz: -3 },
  { n: 'Belo Horizonte', uf: 'MG', lat: -19.92, lon: -43.94, slug: 'belo-horizonte-mg', tz: -3 },
  { n: 'Brasília', uf: 'DF', lat: -15.78, lon: -47.93, slug: 'brasilia-df', tz: -3 },
  { n: 'Curitiba', uf: 'PR', lat: -25.43, lon: -49.27, slug: 'curitiba-pr', tz: -3 },
  { n: 'Porto Alegre', uf: 'RS', lat: -30.03, lon: -51.23, slug: 'porto-alegre-rs', tz: -3 },
  { n: 'Salvador', uf: 'BA', lat: -12.97, lon: -38.51, slug: 'salvador-ba', tz: -3 },
  { n: 'Recife', uf: 'PE', lat: -8.05, lon: -34.88, slug: 'recife-pe', tz: -3 },
  { n: 'Fortaleza', uf: 'CE', lat: -3.73, lon: -38.52, slug: 'fortaleza-ce', tz: -3 },
  { n: 'Belém', uf: 'PA', lat: -1.46, lon: -48.5, slug: 'belem-pa', tz: -3 },
  { n: 'Manaus', uf: 'AM', lat: -3.12, lon: -60.02, slug: 'manaus-am', tz: -4 },
  { n: 'Goiânia', uf: 'GO', lat: -16.69, lon: -49.26, slug: 'goiania-go', tz: -3 },
  { n: 'Campinas', uf: 'SP', lat: -22.91, lon: -47.06, slug: 'campinas-sp', tz: -3 },
  { n: 'Florianópolis', uf: 'SC', lat: -27.6, lon: -48.55, slug: 'florianopolis-sc', tz: -3 },
  { n: 'Vitória', uf: 'ES', lat: -20.32, lon: -40.34, slug: 'vitoria-es', tz: -3 },
  { n: 'Natal', uf: 'RN', lat: -5.79, lon: -35.21, slug: 'natal-rn', tz: -3 },
  { n: 'Cuiabá', uf: 'MT', lat: -15.6, lon: -56.1, slug: 'cuiaba-mt', tz: -4 },
  { n: 'Campo Grande', uf: 'MS', lat: -20.44, lon: -54.65, slug: 'campo-grande-ms', tz: -4 },
];

// Shorter set shown in the header dropdown.
export const POPULAR = CITIES.slice(0, 8);

export const DEFAULT_CITY = CITIES[0];

export function getCityBySlug(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}
