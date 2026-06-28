import Link from 'next/link';
import type { BuiltView } from '@/lib/verdicts';

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        font: '700 11px var(--jakarta)',
        letterSpacing: '.07em',
        textTransform: 'uppercase',
        color: 'var(--muted-2)',
        margin: '28px 0 11px',
      }}
    >
      {children}
    </div>
  );
}

// Per-metric accent (icon circle color + tint) keyed by label.
const METRIC_STYLE: Record<string, { color: string; tint: string }> = {
  Sensação: { color: '#E8590C', tint: '#FDEBDD' },
  Umidade: { color: '#2E7BD6', tint: '#E3F0FB' },
  Vento: { color: '#0EA5A5', tint: '#D8F2F2' },
  Rajadas: { color: '#6366F1', tint: '#E6E7FB' },
  Pressão: { color: '#475569', tint: '#E8ECF2' },
  Nuvens: { color: '#64748B', tint: '#EAEEF3' },
};

const tileStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid rgba(20,40,70,.07)',
  borderRadius: 14,
  padding: '12px 14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

// Temperature → accent color (cold blue ⟶ hot orange), used for the ring.
function tempAccent(t: number): { c: string; soft: string } {
  if (t >= 32) return { c: '#E8590C', soft: '#F6A878' };
  if (t >= 27) return { c: '#F59E0B', soft: '#FAD089' };
  if (t >= 22) return { c: '#14A06B', soft: '#85D4B3' };
  if (t >= 16) return { c: '#2E7BD6', soft: '#9DC4ED' };
  if (t >= 10) return { c: '#3E6FE0', soft: '#A7BEF2' };
  return { c: '#6366F1', soft: '#B4B6F6' };
}

// Compact wind compass with a direction arrow.
function uvInfo(uv: number): { color: string; tint: string; desc: string } {
  if (uv >= 11) return { color: '#7C3AED', tint: '#ECE3FB', desc: 'extremo' };
  if (uv >= 8) return { color: '#DC2626', tint: '#FBE0E0', desc: 'muito alto' };
  if (uv >= 6) return { color: '#E8590C', tint: '#FBE3D6', desc: 'alto' };
  if (uv >= 3) return { color: '#F59E0B', tint: '#FDF0D9', desc: 'moderado' };
  return { color: '#14A06B', tint: '#DCF3E9', desc: 'baixo' };
}

function WindDial({ dir, compass, speed }: { dir: number; compass: string; speed: number }) {
  return (
    <div style={{ position: 'relative', width: 84, height: 84 }}>
      <svg width={84} height={84} viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="44" fill="#fff" stroke="#e2e9f1" strokeWidth="3" />
        <text x="50" y="17" textAnchor="middle" fontSize="11" fontWeight="700" fill="#9aa6b6">N</text>
        <g transform={`rotate(${dir} 50 50)`}>
          <path d="M50 21 L56.5 40 L50 34.5 L43.5 40 Z" fill="#2E7BD6" />
        </g>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
        <span style={{ font: '800 18px var(--jakarta)', color: 'var(--ink)', lineHeight: 1 }}>{speed}</span>
        <span style={{ font: '700 9px var(--jakarta)', color: 'var(--muted-2)' }}>{compass}</span>
      </div>
    </div>
  );
}

// "AGORA EM ..." — temperature ring + condition + wind dial, then metric chips.
export function AgoraCard({ v }: { v: BuiltView }) {
  const a = tempAccent(v.temp);
  const cloud = v.metrics.find((m) => m.label === 'Nuvens');
  const listLabels = ['Sensação', 'Umidade', 'Pressão'];
  const list = v.metrics.filter((m) => listLabels.includes(m.label));
  return (
    <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, #fbfdff 0%, #eef5fc 100%)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        {/* LEFT: temperature ring + cloud cover */}
        <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 146, height: 146, borderRadius: '50%', background: `conic-gradient(from 135deg, ${a.soft}, ${a.c} 55%, ${a.soft})`, padding: 7, boxShadow: `0 8px 22px ${a.c}26` }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ font: '700 13px var(--jakarta)', color: 'var(--muted-2)' }}>
                <span style={{ color: 'var(--muted)' }}>{v.maxToday}°</span> <span style={{ opacity: 0.4 }}>|</span> {v.minToday}°
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 1, margin: '1px 0' }}>
                <span style={{ font: '800 48px var(--jakarta)', color: a.c, lineHeight: 0.9, letterSpacing: '-.03em' }}>{v.temp}</span>
                <span style={{ font: '700 15px var(--jakarta)', color: 'var(--muted)', marginTop: 6 }}>°C</span>
              </div>
              <div style={{ font: '700 11px var(--jakarta)', color: a.c, letterSpacing: '.04em' }}>SENSAÇÃO {v.feels}°</div>
            </div>
          </div>
          {cloud && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '600 12px var(--jakarta)', color: 'var(--muted)' }}>
              <span style={{ fontSize: 13 }}>☁️</span>
              <span style={{ color: 'var(--ink)', fontWeight: 800 }}>{cloud.value}</span> de nuvens
            </div>
          )}
        </div>

        {/* RIGHT: packed two-row panel that fills remaining width */}
        <div style={{ flex: '1 1 340px', minWidth: 260, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* row 1: condition + wind */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ ...tileStyle, flex: 1, flexDirection: 'column', textAlign: 'center', gap: 4 }}>
              <div style={{ fontSize: 40, lineHeight: 1 }}>{v.skyEmoji}</div>
              <div style={{ font: '700 13px var(--jakarta)', color: 'var(--ink)' }}>{v.skyLabel}</div>
            </div>
            <div style={{ ...tileStyle, flex: 1, gap: 12 }}>
              <WindDial dir={v.windDir} compass={v.windCompass} speed={v.windKmh} />
              <div>
                <div style={{ font: '700 12px var(--jakarta)', color: 'var(--muted)' }}>Vento</div>
                <div style={{ font: '800 16px var(--jakarta)', color: 'var(--ink)' }}>{v.windKmh} km/h</div>
                <div style={{ font: '600 11px var(--jakarta)', color: 'var(--muted)', marginTop: 2 }}>rajadas {v.gust} km/h</div>
              </div>
            </div>
            {(() => {
              const u = uvInfo(v.uv);
              return (
                <div style={{ ...tileStyle, flex: 1, flexDirection: 'column', textAlign: 'center', gap: 2 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: u.tint, color: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 17px var(--jakarta)' }}>{v.uv}</div>
                  <div style={{ font: '700 13px var(--jakarta)', color: 'var(--ink)', marginTop: 4 }}>Índice UV</div>
                  <div style={{ font: '600 11px var(--jakarta)', color: u.color }}>{u.desc}</div>
                </div>
              );
            })()}
          </div>
          {/* row 2: metric chips */}
          <div style={{ display: 'flex', gap: 10 }}>
            {list.map((m, i) => {
              const s = METRIC_STYLE[m.label] || { color: 'var(--blue)', tint: '#E3F0FB' };
              return (
                <div key={i} style={{ ...tileStyle, flex: 1, gap: 9, padding: '10px 11px' }}>
                  <span style={{ width: 30, height: 30, flex: 'none', borderRadius: 9, background: s.tint, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                    {m.icon}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ font: '800 15px var(--jakarta)', color: 'var(--ink)', lineHeight: 1.1 }}>{m.value}</div>
                    <div style={{ font: '600 11px var(--jakarta)', color: 'var(--muted-2)', marginTop: 1 }}>{m.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// SEO summary + Zé's one-liner (used on the city page).
export function ResumoZe({ v }: { v: BuiltView }) {
  return (
    <div className="card" style={{ padding: 18, marginTop: 14 }}>
      <p style={{ font: '500 15px/1.6 var(--jakarta)', color: '#3a4658', margin: 0 }}>{v.summary}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
        <span style={{ width: 30, height: 30, flex: 'none', borderRadius: '50%', background: '#FFE9B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>☀️</span>
        <span style={{ font: '600 14px/1.4 var(--jakarta)', color: 'var(--ink)', fontStyle: 'italic' }}>“{v.summaryZe}”</span>
      </div>
    </div>
  );
}

export function RainAlert({ v }: { v: BuiltView }) {
  if (!v.rainAlert) return null;
  return (
    <div
      className="card"
      style={{ padding: 16, marginTop: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}
    >
      <span style={{ fontSize: 22, flex: 'none' }}>🌧️</span>
      <div>
        <div style={{ font: '800 15px var(--jakarta)', color: 'var(--ink)' }}>{v.rainAlert.title}</div>
        <div style={{ font: '500 13px/1.5 var(--jakarta)', color: '#3a4658', marginTop: 3 }}>{v.rainAlert.sub}</div>
      </div>
    </div>
  );
}

export function ProximasHoras({ v }: { v: BuiltView }) {
  if (!v.hours.length) return null;
  return (
    <>
      <SectionLabel>Próximas horas</SectionLabel>
      <div className="ztscroll" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
        {v.hours.map((h, i) => {
          const now = i === 0;
          return (
            <div
              key={i}
              style={{
                flex: 'none',
                width: 78,
                padding: '14px 10px 12px',
                textAlign: 'center',
                borderRadius: 16,
                background: now ? 'linear-gradient(160deg, #2E7BD6 0%, #2563b6 100%)' : '#fff',
                color: now ? '#fff' : 'var(--ink)',
                boxShadow: now ? '0 10px 22px rgba(46,123,214,.34)' : 'var(--card-shadow)',
              }}
            >
              <div style={{ font: '700 12px var(--jakarta)', color: now ? 'rgba(255,255,255,.9)' : 'var(--muted)' }}>
                {now ? 'Agora' : h.hour}
              </div>
              <div style={{ fontSize: 26, margin: '8px 0 6px' }}>{h.emoji}</div>
              <div style={{ font: '800 16px var(--jakarta)' }}>{h.temp}°</div>
              <div style={{ marginTop: 9 }}>
                <div style={{ height: 4, borderRadius: 99, background: now ? 'rgba(255,255,255,.28)' : '#e6eef7', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.max(3, h.prob)}%`, borderRadius: 99, background: now ? '#fff' : 'var(--blue)' }} />
                </div>
                <div style={{ font: '700 10px var(--jakarta)', color: now ? 'rgba(255,255,255,.92)' : 'var(--blue)', marginTop: 5 }}>{h.prob}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function PrevisaoCompletaLink({ v }: { v: BuiltView }) {
  return (
    <Link
      href={`/cidade/${v.city.slug}`}
      className="card"
      style={{ marginTop: 14, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}
    >
      <span style={{ fontSize: 22 }}>📊</span>
      <div style={{ flex: 1 }}>
        <div style={{ font: '700 15px var(--jakarta)', color: 'var(--ink)' }}>Previsão completa de {v.cidade}</div>
        <div style={{ font: '500 12px var(--jakarta)', color: 'var(--muted)' }}>
          7 dias, resumo, perguntas frequentes e todos os vereditos
        </div>
      </div>
      <span style={{ color: 'var(--blue)', font: '800 18px var(--jakarta)' }}>→</span>
    </Link>
  );
}

export function NowStrip({ v }: { v: BuiltView }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginBottom: 4 }}>
      <span style={{ font: '600 13px var(--jakarta)', color: 'var(--muted)' }}>
        📍 {v.cidade}{v.ufSep}
      </span>
      <span style={{ font: '600 13px var(--jakarta)', color: 'var(--muted)' }}>·</span>
      <span style={{ font: '600 13px var(--jakarta)', color: 'var(--muted)' }}>
        {v.skyEmoji} {v.temp}° · {v.skyLabel}
      </span>
    </div>
  );
}

export function SummaryCard({ v }: { v: BuiltView }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ font: '800 40px var(--jakarta)', color: 'var(--ink)', lineHeight: 1 }}>{v.temp}°</div>
          <div style={{ font: '600 13px var(--jakarta)', color: 'var(--muted)', marginTop: 3 }}>
            {v.skyEmoji} {v.skyLabel} · máx {v.maxToday}° / mín {v.minToday}°
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ font: '800 20px var(--jakarta)', color: 'var(--blue)' }}>{v.probToday}%</div>
          <div style={{ font: '600 11px var(--jakarta)', color: '#aab4c2' }}>chuva hoje</div>
        </div>
      </div>
      <p style={{ font: '500 15px/1.6 var(--jakarta)', color: '#3a4658', marginTop: 14 }}>{v.summary}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
        <span style={{ width: 30, height: 30, flex: 'none', borderRadius: '50%', background: '#FFE9B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>☀️</span>
        <span style={{ font: '600 14px/1.4 var(--jakarta)', color: 'var(--ink)', fontStyle: 'italic' }}>“{v.summaryZe}”</span>
      </div>
    </div>
  );
}

// 7-day forecast — deliberately a calm vertical LIST (one row per day) so it
// reads differently from the horizontal "Próximas horas" strip above it. Each
// row carries a min→max temperature range bar (scaled to the week's own range)
// so the whole week's trend is legible at a glance.
export function SevenDay({ v }: { v: BuiltView }) {
  if (!v.days.length) return null;
  const weekMin = Math.min(...v.days.map((d) => d.min));
  const weekMax = Math.max(...v.days.map((d) => d.max));
  const span = weekMax - weekMin || 1;
  return (
    <>
      <SectionLabel>Previsão para os próximos 7 dias</SectionLabel>
      <div className="card" style={{ padding: '6px 6px', display: 'flex', flexDirection: 'column' }}>
        {v.days.map((d, i) => {
          const today = i === 0;
          const a1 = tempAccent(d.min);
          const a2 = tempAccent(d.max);
          const left = ((d.min - weekMin) / span) * 100;
          const width = Math.max(8, ((d.max - d.min) / span) * 100);
          const rainy = d.prob >= 40;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 12px',
                borderRadius: 11,
                background: today ? '#eaf2fc' : 'transparent',
                borderTop: i === 0 ? 'none' : '1px solid #eef3f8',
              }}
            >
              <div style={{ width: 46, flex: 'none', font: `800 13px var(--jakarta)`, color: today ? 'var(--blue)' : 'var(--ink)' }}>
                {today ? 'Hoje' : d.dn}
              </div>
              <div style={{ fontSize: 22, width: 26, flex: 'none', textAlign: 'center' }}>{d.emoji}</div>
              <div style={{ width: 60, flex: 'none', display: 'flex', alignItems: 'center', gap: 4, font: '700 11px var(--jakarta)', color: rainy ? 'var(--blue)' : '#c2ccd9' }}>
                <span style={{ fontSize: 11 }}>💧</span>{d.prob}%
              </div>
              <div style={{ width: 34, flex: 'none', textAlign: 'right', font: '600 13px var(--jakarta)', color: 'var(--muted-2)' }}>{d.min}°</div>
              <div style={{ flex: 1, position: 'relative', height: 8, minWidth: 60 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: 99, background: '#eef3f8' }} />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `${left}%`,
                    width: `${width}%`,
                    borderRadius: 99,
                    background: `linear-gradient(90deg, ${a1.c}, ${a2.c})`,
                  }}
                />
              </div>
              <div style={{ width: 34, flex: 'none', font: '800 14px var(--jakarta)', color: 'var(--ink)' }}>{d.max}°</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// A moon drawn to its real illuminated fraction. Built from a dark disk (the
// shadow), a lit half-disk on the bright limb, and a terminator ellipse that is
// lit for a gibbous moon or dark for a crescent. The bright limb flips by
// hemisphere so it matches what you actually see in the sky (Brazil = south).
function MoonSVG({ illum, waxing, southern, size = 92 }: { illum: number; waxing: boolean; southern: boolean; size?: number }) {
  const R = size / 2 - 3;
  const c = size / 2;
  const f = Math.max(0, Math.min(1, illum / 100));
  const litRight = waxing !== southern; // waxing moon is lit on the left in the south
  const LIT = '#F4EFDD';
  const DARK = '#222f43';
  const absA = Math.abs(R * (1 - 2 * f)); // terminator x-radius
  const halfSweep = litRight ? 1 : 0;
  const halfPath = `M ${c} ${c - R} A ${R} ${R} 0 0 ${halfSweep} ${c} ${c + R} Z`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flex: 'none' }} aria-hidden="true">
      <circle cx={c} cy={c} r={R} fill={DARK} />
      <path d={halfPath} fill={LIT} />
      <ellipse cx={c} cy={c} rx={absA} ry={R} fill={f > 0.5 ? LIT : DARK} />
      <circle cx={c} cy={c} r={R} fill="none" stroke="rgba(22,32,43,.18)" strokeWidth={1} />
    </svg>
  );
}

// Small sunrise/sunset glyph: a sun over a horizon line with an up/down arrow.
function SunHorizonIcon({ dir, size = 22 }: { dir: 'up' | 'down'; size?: number }) {
  const col = dir === 'up' ? '#F59E0B' : '#E8590C';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flex: 'none' }}>
      <line x1="3" y1="19" x2="21" y2="19" stroke={col} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 19a5 5 0 0 1 10 0" fill={col} fillOpacity="0.18" stroke={col} strokeWidth="1.6" strokeLinejoin="round" />
      {dir === 'up' ? (
        <path d="M12 3v6M9.5 5.5L12 3l2.5 2.5" stroke={col} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M12 9V3M9.5 6.5L12 9l2.5-2.5" stroke={col} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <span style={{ width: 30, height: 30, flex: 'none', borderRadius: 9, background: '#F1F6FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <div>
        <div style={{ font: '600 11px var(--jakarta)', color: 'var(--muted-2)' }}>{label}</div>
        <div style={{ font: '800 17px var(--jakarta)', color: 'var(--ink)' }}>{value}</div>
      </div>
    </div>
  );
}

export function AstroGrid({ v }: { v: BuiltView }) {
  const southern = v.city.lat < 0;
  const deltaColor = v.sky.dayDeltaDir === 'longer' ? '#0EA5A5' : v.sky.dayDeltaDir === 'shorter' ? '#E8590C' : 'var(--muted-2)';
  const deltaArrow = v.sky.dayDeltaDir === 'longer' ? '▲' : v.sky.dayDeltaDir === 'shorter' ? '▼' : '•';
  const tw = v.sky.twilight;
  const twRows: [string, string, string][] = [
    ['Civil', tw.civilDawn, tw.civilDusk],
    ['Náutico', tw.nauticalDawn, tw.nauticalDusk],
    ['Astronômico', tw.astroDawn, tw.astroDusk],
  ];
  return (
    <>
      <H2>Céu &amp; Lua em {v.cidade}</H2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
        {/* Moon */}
        <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <MoonSVG illum={v.moon.illum} waxing={v.moon.waxing} southern={southern} size={96} />
            <div style={{ minWidth: 0 }}>
              <div style={{ font: '700 11px var(--jakarta)', letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>Fase da lua</div>
              <div style={{ font: '800 22px var(--jakarta)', color: 'var(--ink)', letterSpacing: '-.01em', marginTop: 2 }}>{v.moon.name}</div>
              <div style={{ font: '600 13px var(--jakarta)', color: '#3a4658', marginTop: 4 }}>{v.moon.illum}% iluminada</div>
              <div style={{ display: 'inline-block', marginTop: 8, font: '700 11px var(--jakarta)', color: '#6366F1', background: '#6366F114', padding: '3px 9px', borderRadius: 999 }}>
                {v.moon.waxing ? 'Crescendo' : 'Minguando'} · {v.moon.ageDays} dias
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16, paddingTop: 14, borderTop: '1px solid #eef3f8' }}>
            <MiniStat icon={<span style={{ fontSize: 16 }}>🌝</span>} label="Nascer da lua" value={v.moon.moonrise} />
            <MiniStat icon={<span style={{ fontSize: 16 }}>🌚</span>} label="Pôr da lua" value={v.moon.moonset} />
          </div>
        </div>

        {/* Sun + day length + twilight */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <MiniStat icon={<SunHorizonIcon dir="up" />} label="Nascer do sol" value={v.sky.sunrise} />
            <MiniStat icon={<SunHorizonIcon dir="down" />} label="Pôr do sol" value={v.sky.sunset} />
          </div>

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #eef3f8' }}>
            <span style={{ font: '600 13px var(--jakarta)', color: '#3a4658' }}>
              Dia com <strong style={{ color: 'var(--ink)' }}>{v.sky.dayLength}</strong> de luz
            </span>
            <div style={{ font: '700 12px var(--jakarta)', color: deltaColor, marginTop: 3 }}>
              {deltaArrow} Amanhã será {v.sky.dayDeltaText}
            </div>
          </div>

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #eef3f8' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 58px 58px', columnGap: 12, alignItems: 'baseline' }}>
              <span style={{ font: '700 10px var(--jakarta)', letterSpacing: '.05em', textTransform: 'uppercase', color: '#aab4c2' }}>Crepúsculo</span>
              <span style={{ font: '700 10px var(--jakarta)', letterSpacing: '.04em', textTransform: 'uppercase', color: '#aab4c2', textAlign: 'right' }}>Alvorada</span>
              <span style={{ font: '700 10px var(--jakarta)', letterSpacing: '.04em', textTransform: 'uppercase', color: '#aab4c2', textAlign: 'right' }}>Anoitecer</span>
              {twRows.flatMap(([label, dawn, dusk]) => [
                <span key={`${label}-l`} style={{ font: '600 12px var(--jakarta)', color: 'var(--muted-2)', paddingTop: 7 }}>{label}</span>,
                <span key={`${label}-a`} style={{ font: '700 12px var(--jakarta)', color: 'var(--ink)', textAlign: 'right', paddingTop: 7 }}>{dawn}</span>,
                <span key={`${label}-d`} style={{ font: '700 12px var(--jakarta)', color: 'var(--ink)', textAlign: 'right', paddingTop: 7 }}>{dusk}</span>,
              ])}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function Faq({ v }: { v: BuiltView }) {
  return (
    <>
      <H2>Perguntas frequentes sobre o tempo em {v.cidade}</H2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {v.faqs.map((f, i) => (
          <div key={i} className="card" style={{ padding: 16 }}>
            <div style={{ font: '700 15px var(--jakarta)', color: 'var(--ink)' }}>{f.q}</div>
            <p style={{ font: '500 14px/1.6 var(--jakarta)', color: '#3a4658', marginTop: 6 }}>{f.a}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ font: '800 20px var(--jakarta)', color: 'var(--ink)', letterSpacing: '-.01em', margin: '26px 0 12px' }}>
      {children}
    </h2>
  );
}
