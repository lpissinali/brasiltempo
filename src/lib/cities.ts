import type { City } from './types';

// Curated Brazilian cities — pre-rendered with clean slugs, listed in the
// sitemap, and indexable. The 27 capitals come first, then the most populous
// municipalities. Worldwide search (any city) is still handled dynamically via
// geocoding; see lib/geocode.ts.
//
// Timezone is derived from the state (Brazil has no DST since 2019): Acre = -5;
// Amazonas, Roraima, Rondônia, Mato Grosso and Mato Grosso do Sul = -4; every
// other state = -3. (Far-western Amazonas towns are -5, but the populous AM city,
// Manaus, is correctly -4.)
const TZ_MINUS_4 = new Set(['AM', 'RR', 'RO', 'MT', 'MS']);
function tzForUf(uf: string): number {
  return uf === 'AC' ? -5 : TZ_MINUS_4.has(uf) ? -4 : -3;
}

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// [name, UF, lat, lon]. The first 27 entries are the state capitals (+ DF).
const RAW: [string, string, number, number][] = [
  // --- 27 capitals ---
  ['São Paulo', 'SP', -23.55, -46.63],
  ['Rio de Janeiro', 'RJ', -22.91, -43.17],
  ['Brasília', 'DF', -15.78, -47.93],
  ['Salvador', 'BA', -12.97, -38.51],
  ['Fortaleza', 'CE', -3.73, -38.52],
  ['Belo Horizonte', 'MG', -19.92, -43.94],
  ['Manaus', 'AM', -3.12, -60.02],
  ['Curitiba', 'PR', -25.43, -49.27],
  ['Recife', 'PE', -8.05, -34.88],
  ['Goiânia', 'GO', -16.69, -49.26],
  ['Belém', 'PA', -1.46, -48.5],
  ['Porto Alegre', 'RS', -30.03, -51.23],
  ['São Luís', 'MA', -2.53, -44.3],
  ['Maceió', 'AL', -9.65, -35.74],
  ['Campo Grande', 'MS', -20.44, -54.65],
  ['Teresina', 'PI', -5.09, -42.8],
  ['Natal', 'RN', -5.79, -35.21],
  ['João Pessoa', 'PB', -7.12, -34.86],
  ['Aracaju', 'SE', -10.95, -37.07],
  ['Cuiabá', 'MT', -15.6, -56.1],
  ['Florianópolis', 'SC', -27.6, -48.55],
  ['Porto Velho', 'RO', -8.76, -63.9],
  ['Macapá', 'AP', 0.04, -51.07],
  ['Vitória', 'ES', -20.32, -40.34],
  ['Rio Branco', 'AC', -9.97, -67.81],
  ['Boa Vista', 'RR', 2.82, -60.67],
  ['Palmas', 'TO', -10.18, -48.33],
  // --- most populous non-capital municipalities ---
  ['Guarulhos', 'SP', -23.46, -46.53],
  ['Campinas', 'SP', -22.91, -47.06],
  ['São Gonçalo', 'RJ', -22.83, -43.05],
  ['Nova Iguaçu', 'RJ', -22.76, -43.45],
  ['São Bernardo do Campo', 'SP', -23.69, -46.56],
  ['Duque de Caxias', 'RJ', -22.79, -43.31],
  ['São José dos Campos', 'SP', -23.18, -45.89],
  ['Jaboatão dos Guararapes', 'PE', -8.11, -35.01],
  ['Osasco', 'SP', -23.53, -46.79],
  ['Santo André', 'SP', -23.66, -46.53],
  ['Ribeirão Preto', 'SP', -21.18, -47.81],
  ['Uberlândia', 'MG', -18.91, -48.27],
  ['Sorocaba', 'SP', -23.5, -47.46],
  ['Contagem', 'MG', -19.93, -44.05],
  ['Feira de Santana', 'BA', -12.27, -38.97],
  ['Joinville', 'SC', -26.3, -48.85],
  ['Juiz de Fora', 'MG', -21.76, -43.35],
  ['Londrina', 'PR', -23.31, -51.16],
  ['Aparecida de Goiânia', 'GO', -16.82, -49.24],
  ['Niterói', 'RJ', -22.88, -43.1],
  ['Ananindeua', 'PA', -1.37, -48.37],
  ['Belford Roxo', 'RJ', -22.76, -43.4],
  ['Campos dos Goytacazes', 'RJ', -21.75, -41.33],
  ['Caxias do Sul', 'RS', -29.17, -51.18],
  ['São João de Meriti', 'RJ', -22.8, -43.37],
  ['Mauá', 'SP', -23.67, -46.46],
  ['Betim', 'MG', -19.97, -44.2],
  ['Caruaru', 'PE', -8.28, -35.97],
  ['Vila Velha', 'ES', -20.33, -40.29],
  ['Serra', 'ES', -20.13, -40.31],
  ['Diadema', 'SP', -23.69, -46.62],
  ['Campina Grande', 'PB', -7.22, -35.88],
  ['Maringá', 'PR', -23.42, -51.94],
  ['Jundiaí', 'SP', -23.19, -46.88],
  ['Montes Claros', 'MG', -16.74, -43.86],
  ['Carapicuíba', 'SP', -23.52, -46.84],
  ['Piracicaba', 'SP', -22.73, -47.65],
  ['Bauru', 'SP', -22.31, -49.06],
  ['Mogi das Cruzes', 'SP', -23.52, -46.19],
  ['Anápolis', 'GO', -16.33, -48.95],
  ['Pelotas', 'RS', -31.77, -52.34],
  ['Canoas', 'RS', -29.92, -51.18],
  ['Vitória da Conquista', 'BA', -14.86, -40.84],
  ['Santos', 'SP', -23.96, -46.33],
  ['Itaquaquecetuba', 'SP', -23.49, -46.34],
  ['São Vicente', 'SP', -23.96, -46.39],
  ['Caucaia', 'CE', -3.74, -38.65],
  ['Franca', 'SP', -20.54, -47.4],
  ['Cariacica', 'ES', -20.26, -40.42],
  ['Ponta Grossa', 'PR', -25.09, -50.16],
  ['Petrolina', 'PE', -9.39, -40.5],
  ['Paulista', 'PE', -7.94, -34.87],
  ['Uberaba', 'MG', -19.75, -47.93],
  ['Cascavel', 'PR', -24.96, -53.46],
  ['São José do Rio Preto', 'SP', -20.82, -49.38],
  ['Mossoró', 'RN', -5.19, -37.34],
  ['Blumenau', 'SC', -26.92, -49.07],
  ['Santa Maria', 'RS', -29.68, -53.81],
  ['Gravataí', 'RS', -29.94, -50.99],
  ['Volta Redonda', 'RJ', -22.52, -44.1],
  ['Petrópolis', 'RJ', -22.51, -43.18],
  ['Foz do Iguaçu', 'PR', -25.52, -54.59],
  ['Camaçari', 'BA', -12.7, -38.32],
  ['Taubaté', 'SP', -23.03, -45.56],
  ['Limeira', 'SP', -22.56, -47.4],
  ['Suzano', 'SP', -23.54, -46.31],
  ['Governador Valadares', 'MG', -18.85, -41.95],
  ['Várzea Grande', 'MT', -15.65, -56.13],
  ['Novo Hamburgo', 'RS', -29.69, -51.13],
  ['Imperatriz', 'MA', -5.53, -47.48],
  ['Juazeiro do Norte', 'CE', -7.21, -39.31],
  ['São José dos Pinhais', 'PR', -25.53, -49.2],
  ['Marília', 'SP', -22.21, -49.95],
  ['Macaé', 'RJ', -22.37, -41.79],
];

export const CITIES: City[] = RAW.map(([n, uf, lat, lon]) => ({
  n,
  uf,
  lat,
  lon,
  slug: `${slugify(n)}-${uf.toLowerCase()}`,
  tz: tzForUf(uf),
}));

// The 27 capitals — used for the national snapshot (bounded set of live fetches)
// and as the "Brazil overview" scope for nationwide questions.
export const CAPITALS: City[] = CITIES.slice(0, 27);

// Shorter set shown in the header dropdown + footer.
export const POPULAR = CITIES.slice(0, 8);

export const DEFAULT_CITY = CITIES[0];

export function getCityBySlug(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}
