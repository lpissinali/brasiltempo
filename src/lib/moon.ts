// Moon phase from date — no API needed. Based on a known new-moon epoch and the
// mean synodic month. Returns Brazilian-Portuguese phase name, emoji, and
// illuminated fraction (%). Ported from the prototype's approach.

const SYNODIC = 29.53058867; // days

const NAMES = [
  'Nova',
  'Crescente côncava',
  'Quarto crescente',
  'Crescente gibosa',
  'Cheia',
  'Minguante gibosa',
  'Quarto minguante',
  'Minguante côncava',
];
const EMOJIS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

export function moonPhase(date = new Date()): { name: string; emoji: string; illum: number } {
  // Reference new moon: 2000-01-06 18:14 UTC
  const ref = Date.UTC(2000, 0, 6, 18, 14, 0);
  const days = (date.getTime() - ref) / 86400000;
  const frac = ((days % SYNODIC) + SYNODIC) % SYNODIC / SYNODIC; // 0..1
  const idx = Math.round(frac * 8) % 8;
  const illum = Math.round(((1 - Math.cos(2 * Math.PI * frac)) / 2) * 100);
  return { name: NAMES[idx], emoji: EMOJIS[idx], illum };
}
