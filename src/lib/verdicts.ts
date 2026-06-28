import type { City, Forecast, VerdictCardData } from './types';
import { skyMap, degToCompass } from './sky';
import { zePhrase, daySeed, type PoolKey, type ZePhraseSet } from './phrases';
import { moonPhase, moonRiseSet } from './moon';
import { sunTimes } from './sun';

// Verdict thresholds ported verbatim from the prototype. All transparent and
// tunable. The engine reads the normalized Forecast (Open-Meteo shape), so it
// works identically on NOAA GFS or any other source.

const DIA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const num = (a: number[] | undefined, i: number, def: number) =>
  a && a[i] != null && !Number.isNaN(a[i]) ? a[i] : def;
const dow = (t: string) => new Date(t + 'T12:00:00').getDay();
const r = Math.round;

export interface BuiltView {
  city: City;
  cidade: string;
  ufSep: string;
  temp: number;
  feels: number;
  skyEmoji: string;
  skyLabel: string;
  maxToday: number;
  minToday: number;
  probToday: number;
  humidity: number;
  windKmh: number;
  windDir: number;
  windCompass: string;
  gust: number;
  uv: number;
  cards: VerdictCardData[]; // the 2–3 most relevant, for the homepage section
  allCards: VerdictCardData[]; // every verdict, for intent lookup (free-question box)
  summary: string;
  summaryZe: string;
  seoIntro: string;
  faqs: { q: string; a: string }[];
  days: { dn: string; emoji: string; max: number; min: number; prob: number }[];
  metrics: { icon: string; label: string; value: string }[];
  hours: { hour: string; emoji: string; temp: number; prob: number }[];
  rainAlert: { title: string; sub: string } | null;
  daylight: string;
  moon: { name: string; emoji: string; illum: number; frac: number; waxing: boolean; ageDays: number; moonrise: string; moonset: string };
  sky: {
    sunrise: string;
    sunset: string;
    dayLength: string;
    dayDeltaText: string;
    dayDeltaDir: 'shorter' | 'longer' | 'same';
    twilight: {
      civilDawn: string;
      civilDusk: string;
      nauticalDawn: string;
      nauticalDusk: string;
      astroDawn: string;
      astroDusk: string;
    };
  };
  source: string;
  fetchedAt: string;
}

export function buildView(city: City, d: Forecast, phrases: ZePhraseSet = {}): BuiltView {
  const seed = daySeed();
  // Prefer an AI-generated line when present for this pool; otherwise fall back
  // to the deterministic static pool. The seam stays in one place.
  const ze = (pool: PoolKey): string => phrases[pool] ?? zePhrase(pool, seed);
  const cur = d.current;
  const dl = d.daily;
  const sky = skyMap(cur.weather_code, cur.is_day);

  const temp = r(cur.temperature_2m);
  const feels = r(cur.apparent_temperature);
  const maxToday = r(num(dl.temperature_2m_max, 0, 0));
  const minToday = r(num(dl.temperature_2m_min, 0, 0));
  const probToday = r(num(dl.precipitation_probability_max, 0, 0));
  const humidity = r(cur.relative_humidity_2m);
  const windKmh = r(cur.wind_speed_10m);
  const uv = num(dl.uv_index_max, 0, 0);

  // --- 1. Vai chover amanhã? (dia+1) ---
  const prob1 = num(dl.precipitation_probability_max, 1, 0);
  const sum1 = num(dl.precipitation_sum, 1, 0);
  let rainBig: string, rainPool: Parameters<typeof zePhrase>[0];
  if (prob1 >= 60 || sum1 >= 8) { rainBig = 'VAI SIM'; rainPool = 'rainSim'; }
  else if (prob1 >= 30 || sum1 >= 2) { rainBig = 'TALVEZ'; rainPool = 'rainTalvez'; }
  else { rainBig = 'NÃO'; rainPool = 'rainNao'; }
  const rainMeta = `amanhã · ${prob1}% · ${r(sum1)}mm`;

  // --- weekend indices ---
  const times = dl.time || [];
  let wk: number[] = [];
  for (let i = 0; i < times.length; i++) { const w = dow(times[i]); if (w === 0 || w === 6) wk.push(i); }
  if (!wk.length) wk = [Math.min(5, times.length - 1), Math.min(6, times.length - 1)];

  // --- 2. Praia no fds ---
  const score = (i: number) => {
    const p = num(dl.precipitation_probability_max, i, 50);
    const tm = num(dl.temperature_2m_max, i, 25);
    const w = num(dl.wind_speed_10m_max, i, 20);
    const co = num(dl.weather_code, i, 3);
    let s = 0;
    s += p < 20 ? 2 : p < 40 ? 1 : 0;
    s += tm >= 28 ? 2 : tm >= 23 ? 1 : 0;
    s += w < 20 ? 2 : w < 30 ? 1 : 0;
    s += co <= 1 ? 2 : co <= 3 ? 1 : 0;
    return s;
  };
  let praiaI = wk[0];
  wk.forEach((i) => { if (score(i) > score(praiaI)) praiaI = i; });
  const ps = score(praiaI);
  let praiaBig: string, praiaPool: Parameters<typeof zePhrase>[0];
  if (ps >= 6) { praiaBig = 'BORA'; praiaPool = 'praiaBora'; }
  else if (ps >= 3) { praiaBig = 'DÁ PRA ARRISCAR'; praiaPool = 'praiaArr'; }
  else { praiaBig = 'FICA EM CASA'; praiaPool = 'praiaCasa'; }
  const praiaMeta = `${DIA[dow(times[praiaI])]} · ${r(num(dl.temperature_2m_max, praiaI, 25))}° · ${num(dl.precipitation_probability_max, praiaI, 0)}%`;

  // --- 3. Churrasco fds ---
  let churI = wk[0];
  wk.forEach((i) => { if (num(dl.precipitation_probability_max, i, 100) < num(dl.precipitation_probability_max, churI, 100)) churI = i; });
  const cp = num(dl.precipitation_probability_max, churI, 50);
  const ct = num(dl.temperature_2m_max, churI, 20);
  let churBig: string, churPool: Parameters<typeof zePhrase>[0];
  if (cp <= 30 && ct >= 20) { churBig = 'ACENDE A GRELHA'; churPool = 'churAcende'; }
  else if (cp <= 50) { churBig = 'PLANO B'; churPool = 'churB'; }
  else { churBig = 'LÁ DENTRO'; churPool = 'churDentro'; }
  const churMeta = `${DIA[dow(times[churI])]} · ${cp}% chuva`;

  // --- 4. Casaco hoje ---
  const appMin = num(dl.apparent_temperature_min, 0, 18);
  let casBig: string, casPool: Parameters<typeof zePhrase>[0];
  if (appMin < 14) { casBig = 'COM CERTEZA'; casPool = 'casSim'; }
  else if (appMin <= 18) { casBig = 'UM CASAQUINHO'; casPool = 'casTalvez'; }
  else { casBig = 'NEM PRECISA'; casPool = 'casNao'; }
  const casMeta = `mín ${r(appMin)}°`;

  // --- 5. Protetor hoje ---
  let uvBig: string, uvPool: Parameters<typeof zePhrase>[0];
  if (uv >= 8) { uvBig = 'PASSA AGORA'; uvPool = 'uvAgora'; }
  else if (uv >= 6) { uvBig = 'PASSA SIM'; uvPool = 'uvSim'; }
  else if (uv >= 3) { uvBig = 'RECOMENDADO'; uvPool = 'uvRec'; }
  else { uvBig = 'RELAXA'; uvPool = 'uvRelaxa'; }
  const uvMeta = `UV ${r(uv)}`;

  // --- relevance: surface only the questions that actually matter right now ---
  // "fds" questions (praia/churrasco) matter more as the weekend approaches; the
  // cold/UV questions matter only when it's actually cold / sunny; rain-tomorrow
  // is the near-constant anchor. Each card carries a 0–100 score; buildView then
  // returns the top 2–3 so the section stays sharp instead of dumping six cards.
  const todayDow = dow(times[0] || new Date().toISOString().slice(0, 10));
  const dWeekend = Math.min((6 - todayDow + 7) % 7, (0 - todayDow + 7) % 7); // days to Sat/Sun
  const wkFactor = dWeekend === 0 ? 1 : dWeekend <= 2 ? 0.85 : 0.62;

  const relRain = rainBig === 'VAI SIM' ? 92 : rainBig === 'TALVEZ' ? 74 : 48;
  const relPraia = (ps >= 6 ? 86 : ps >= 3 ? 64 : 46) * wkFactor;
  const relCasaco = appMin < 14 ? 90 : appMin <= 18 ? 66 : 28;
  const relChur = (churBig === 'ACENDE A GRELHA' ? 80 : churBig === 'PLANO B' ? 60 : 50) * wkFactor;
  const relUv = uv >= 8 ? 90 : uv >= 6 ? 70 : uv >= 3 ? 46 : 22;

  const allCards: VerdictCardData[] = [
    { key: 'chover', icon: '🌧️', q: 'Vai chover amanhã?', big: rainBig, ze: ze(rainPool), meta: rainMeta, accent: '#2E7BD6', rel: relRain },
    { key: 'praia', icon: '🏖️', q: 'Posso ir à praia no fds?', big: praiaBig, ze: ze(praiaPool), meta: praiaMeta, accent: '#0EA5A5', rel: relPraia },
    { key: 'casaco', icon: '🧥', q: 'Preciso de casaco hoje?', big: casBig, ze: ze(casPool), meta: casMeta, accent: '#6366F1', rel: relCasaco },
    { key: 'churrasco', icon: '🍖', q: 'Rola um churrasco no fds?', big: churBig, ze: ze(churPool), meta: churMeta, accent: '#E8590C', rel: relChur },
    { key: 'protetor', icon: '🧴', q: 'Tenho que passar protetor?', big: uvBig, ze: ze(uvPool), meta: uvMeta, accent: '#F59E0B', rel: relUv },
  ];

  // Show cards above the relevance floor (max 3), but never fewer than 2.
  const REL_FLOOR = 55;
  const ranked = [...allCards].sort((a, b) => b.rel - a.rel);
  let cards = ranked.filter((c) => c.rel >= REL_FLOOR).slice(0, 3);
  if (cards.length < 2) cards = ranked.slice(0, 2);

  // --- summary + SEO prose (data-anchored) ---
  const ufFull = city.uf ? `${city.n} (${city.uf})` : city.n;
  const rainTodayTxt = probToday >= 60 ? 'com boa chance de chuva' : probToday >= 30 ? 'com a chuva rondando' : 'sem grande risco de chuva';
  const amanhaTxt = rainBig === 'VAI SIM' ? 'a chuva chega com tudo' : rainBig === 'TALVEZ' ? 'o tempo fica indeciso' : 'o sol deve predominar';
  const fdsTxt = praiaBig === 'BORA' ? 'dá pra curtir a praia' : praiaBig === 'DÁ PRA ARRISCAR' ? 'dá pra arriscar uma praia' : 'é melhor ficar por perto';
  const churTxt = churBig === 'ACENDE A GRELHA' ? 'pode acender a grelha' : churBig === 'PLANO B' ? 'tenha um plano B pro churrasco' : 'o churrasco fica melhor na garagem';
  const uvTxt = uv >= 8 ? 'muito alto — capriche no protetor' : uv >= 6 ? 'alto, vale o protetor' : uv >= 3 ? 'moderado' : 'baixo';

  const summary = `Hoje em ${city.n}, ${sky.label.toLowerCase()} com máxima de ${maxToday}° e mínima de ${minToday}°, ${rainTodayTxt} (${probToday}%). Amanhã ${amanhaTxt}. No fim de semana ${fdsTxt}, e pro churrasco ${churTxt}. O índice UV chega a ${r(uv)}, ${uvTxt}.`;
  const summaryZe = ze('resumo');

  const sunrise = (dl.sunrise[0] || '').slice(11) || '—';
  const sunset = (dl.sunset[0] || '').slice(11) || '—';
  const seoIntro = `A previsão do tempo em ${ufFull} aponta ${sky.label.toLowerCase()} neste momento, com ${temp}°C e sensação de ${feels}°C. A umidade do ar está em ${humidity}% e o vento sopra a ${windKmh} km/h. O sol nasce às ${sunrise} e se põe às ${sunset}. Para hoje, a máxima prevista é de ${maxToday}°C e a mínima de ${minToday}°C, com ${probToday}% de chance de chuva. O Zé resume tudo isso em vereditos diretos logo abaixo, pra você decidir rapidinho se dá praia, churrasco ou se é melhor levar o casaco.`;

  const faqs = [
    { q: `Vai chover amanhã em ${city.n}?`, a: `Para amanhã, a chance de chuva é de ${prob1}% com previsão de ${r(sum1)}mm. Resumindo: ${rainBig.toLowerCase()}. ${ze(rainPool)}` },
    { q: `Faz frio hoje em ${city.n}?`, a: `A mínima da sensação térmica hoje é de cerca de ${r(appMin)}°C. Veredito do casaco: ${casBig.toLowerCase()}. ${ze(casPool)}` },
    { q: `Dá pra ir à praia neste fim de semana em ${city.n}?`, a: `O melhor dia do fim de semana é ${DIA[dow(times[praiaI])]}, com máxima de ${r(num(dl.temperature_2m_max, praiaI, 25))}°C e ${num(dl.precipitation_probability_max, praiaI, 0)}% de chuva. Veredito: ${praiaBig.toLowerCase()}.` },
    { q: `Qual o índice UV hoje em ${city.n}?`, a: `O índice UV máximo previsto é ${r(uv)} (${uvTxt}). ${ze(uvPool)}` },
  ];

  // --- 7-day strip ---
  const days = times.slice(0, 7).map((t, i) => ({
    dn: DIA[dow(t)],
    emoji: skyMap(num(dl.weather_code, i, 3), 1).emoji,
    max: r(num(dl.temperature_2m_max, i, 0)),
    min: r(num(dl.temperature_2m_min, i, 0)),
    prob: r(num(dl.precipitation_probability_max, i, 0)),
  }));

  // --- current metric tiles (AGORA EM ...) ---
  const metrics = [
    { icon: '🌡️', label: 'Sensação', value: `${feels}°` },
    { icon: '💧', label: 'Umidade', value: `${humidity}%` },
    { icon: '🍃', label: 'Vento', value: `${windKmh} ${degToCompass(cur.wind_direction_10m)}` },
    { icon: '💨', label: 'Rajadas', value: `${r(cur.wind_gusts_10m)} km/h` },
    { icon: '🔵', label: 'Pressão', value: `${r(cur.pressure_msl)} hPa` },
    { icon: '☁️', label: 'Nuvens', value: `${r(cur.cloud_cover)}%` },
  ];

  // --- próximas horas ---
  // Per-hour day/night so emojis use sun by day and moon by night (not the
  // single current-moment flag).
  const srH = parseInt(sunrise.slice(0, 2), 10) || 6;
  const ssH = parseInt(sunset.slice(0, 2), 10) || 18;
  const hours = (d.hourly.time || []).slice(0, 12).map((t, i) => {
    const hh = parseInt(t.slice(11, 13), 10);
    const hourIsDay = hh >= srH && hh < ssH ? 1 : 0;
    return {
      hour: t.slice(11, 16),
      emoji: skyMap(d.hourly.weather_code[i], hourIsDay).emoji,
      temp: r(d.hourly.temperature_2m[i]),
      prob: d.hourly.precipitation_probability[i],
    };
  });

  // --- today's rain window (derived from hourly precip probability) ---
  const todayStr = (d.hourly.time[0] || '').slice(0, 10);
  const rainyHours = (d.hourly.time || [])
    .map((t, i) => ({ t, i }))
    .filter(({ t, i }) => t.slice(0, 10) === todayStr && d.hourly.precipitation_probability[i] >= 50);
  let rainAlert: BuiltView['rainAlert'] = null;
  if (rainyHours.length) {
    const startH = rainyHours[0].t.slice(11, 16);
    const endH = rainyHours[rainyHours.length - 1].t.slice(11, 16);
    rainAlert = {
      title: `Chuva por volta das ${startH} às ${endH}`,
      sub: `São cerca de ${rainyHours.length}h de chuva no radar de hoje — deixa o guarda-chuva à mão.`,
    };
  }

  // --- daylight, day-length delta, twilight + moon ---
  const [sy, sm, sd] = (times[0] || '').split('-').map(Number);
  const st = sy ? sunTimes(new Date(Date.UTC(sy, sm - 1, sd)), city.lat, city.lon, city.tz) : null;
  const dm = st ? st.daylightMinutes : 0;
  const daylight = `${Math.floor(dm / 60)}h ${String(dm % 60).padStart(2, '0')}min`;
  const mrs = sy ? moonRiseSet(new Date(Date.UTC(sy, sm - 1, sd)), city.lat, city.lon, city.tz) : { rise: null, set: null };
  const moon = { ...moonPhase(), moonrise: mrs.rise ?? '—', moonset: mrs.set ?? '—' };

  // Precise tomorrow vs today day-length delta (minutes + seconds).
  let dayDeltaText = '—';
  let dayDeltaDir: 'shorter' | 'longer' | 'same' = 'same';
  if (st && sy) {
    const stTomorrow = sunTimes(new Date(Date.UTC(sy, sm - 1, sd + 1)), city.lat, city.lon, city.tz);
    const diff = stTomorrow.daylightSeconds - st.daylightSeconds; // seconds
    dayDeltaDir = diff > 2 ? 'longer' : diff < -2 ? 'shorter' : 'same';
    const abs = Math.abs(diff);
    const mm = Math.floor(abs / 60);
    const ss = abs % 60;
    dayDeltaText =
      dayDeltaDir === 'same'
        ? 'praticamente igual a hoje'
        : `${mm} min ${ss} s mais ${dayDeltaDir === 'longer' ? 'longo' : 'curto'}`;
  }

  const skyData = {
    sunrise,
    sunset,
    dayLength: daylight,
    dayDeltaText,
    dayDeltaDir,
    twilight: st
      ? st.twilight
      : { civilDawn: '—', civilDusk: '—', nauticalDawn: '—', nauticalDusk: '—', astroDawn: '—', astroDusk: '—' },
  };

  return {
    city,
    cidade: city.n,
    ufSep: city.uf ? `, ${city.uf}` : '',
    temp, feels, skyEmoji: sky.emoji, skyLabel: sky.label,
    maxToday, minToday, probToday, humidity, windKmh,
    windDir: cur.wind_direction_10m, windCompass: degToCompass(cur.wind_direction_10m), gust: r(cur.wind_gusts_10m), uv: r(uv),
    cards, allCards, summary, summaryZe, seoIntro, faqs, days,
    metrics, hours, rainAlert, daylight, moon, sky: skyData,
    source: d.source, fetchedAt: d.fetchedAt,
  };
}
