'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo, Wordmark } from './Logo';
import { SearchIcon, LocateIcon, Spinner } from './Icons';
import { POPULAR } from '@/lib/cities';

interface GeoResult {
  name: string;
  region?: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  timezone: string;
  slug: string;
}

export function Header() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [citiesOpen, setCitiesOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoErr, setGeoErr] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const data = await res.json();
        setResults(data.results || []);
        setOpen(true);
      } catch {
        /* aborted or failed */
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
      if (navRef.current && !navRef.current.contains(e.target as Node)) setCitiesOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function navParams(r: { lat: number; lon: number; name: string; region?: string; country: string; timezone: string }) {
    return new URLSearchParams({
      lat: String(r.lat),
      lon: String(r.lon),
      n: r.name,
      r: r.region || '',
      c: r.country,
      tz: r.timezone,
    }).toString();
  }

  function goTo(r: GeoResult) {
    setQ('');
    setResults([]);
    setOpen(false);
    router.push(`/cidade/${r.slug}?${navParams(r)}`);
  }

  function useMyLocation() {
    setGeoErr(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoErr('Seu navegador não suporta localização.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
          const res = await fetch(`/api/reverse?lat=${lat}&lon=${lon}`);
          if (!res.ok) throw new Error('reverse');
          const d = await res.json();
          const params = navParams({ lat: d.lat, lon: d.lon, name: d.name, region: d.region, country: d.country, timezone: tz });
          router.push(`/cidade/${d.slug}?${params}`);
        } catch {
          setGeoErr('Não consegui descobrir sua cidade. Tenta buscar pelo nome.');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setGeoErr(
          err.code === err.PERMISSION_DENIED
            ? 'Permissão de localização negada.'
            : 'Não consegui pegar sua localização.',
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  }

  return (
    <header style={{ background: 'var(--ink)', position: 'relative', zIndex: 50 }}>
      <div
        style={{
          maxWidth: 1040,
          margin: '0 auto',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 'none' }}>
          <Logo size={32} bob />
          <Wordmark light />
        </Link>

        {/* search (grows) */}
        <div ref={boxRef} style={{ position: 'relative', flex: '1 1 240px', minWidth: 180 }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', display: 'flex', color: '#8aa0bd' }}>
            {loading ? <Spinner size={15} /> : <SearchIcon size={15} />}
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => results.length && setOpen(true)}
            placeholder="buscar qualquer cidade do mundo…"
            style={{
              width: '100%', appearance: 'none', border: '1px solid #38465a', background: '#222f40',
              color: '#fff', borderRadius: 18, padding: '9px 12px 9px 36px', font: '600 13px var(--jakarta)', outline: 'none',
            }}
          />
          {open && (results.length > 0 || (!loading && q.trim().length >= 2)) && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', borderRadius: 12, boxShadow: '0 16px 40px rgba(20,40,70,.25)', padding: 6, maxHeight: 360, overflowY: 'auto', zIndex: 70 }}>
              {results.length === 0 ? (
                <div style={{ padding: '10px 11px', font: '600 13px var(--jakarta)', color: 'var(--muted)' }}>
                  Nenhuma cidade encontrada.
                </div>
              ) : (
                results.map((r, i) => (
                  <button
                    key={`${r.slug}-${i}`}
                    onClick={() => goTo(r)}
                    style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8, padding: '9px 11px', display: 'flex', alignItems: 'baseline', gap: 6 }}
                  >
                    <span style={{ font: '700 13px var(--jakarta)', color: 'var(--ink)' }}>{r.name}</span>
                    <span style={{ font: '500 12px var(--jakarta)', color: 'var(--muted)' }}>
                      {[r.region, r.country].filter(Boolean).join(', ')}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* my-location button */}
        <button
          onClick={useMyLocation}
          disabled={locating}
          title="Usar minha localização"
          aria-label="Usar minha localização"
          style={{
            flex: 'none', appearance: 'none', cursor: locating ? 'default' : 'pointer',
            border: '1px solid #38465a', background: '#222f40', color: 'var(--blue-light)',
            borderRadius: 14, width: 38, height: 38, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {locating ? <Spinner size={17} /> : <LocateIcon size={18} />}
        </button>

        {/* nav cluster */}
        <div ref={navRef} style={{ position: 'relative', display: 'flex', gap: 8, flex: 'none' }}>
          <button onClick={() => setCitiesOpen((o) => !o)} style={navBtnStyle}>Cidades populares ▾</button>
          <Link href="/blog" style={navBtnStyle}>Blog</Link>
          {citiesOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', borderRadius: 14, boxShadow: '0 16px 40px rgba(20,40,70,.25)', padding: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, minWidth: 300, zIndex: 60 }}>
              {POPULAR.map((c) => (
                <Link key={c.slug} href={`/cidade/${c.slug}`} onClick={() => setCitiesOpen(false)} style={{ borderRadius: 9, padding: '9px 11px', background: '#F6F9FC', font: '600 13px var(--jakarta)', color: 'var(--ink)' }}>
                  {c.n}
                </Link>
              ))}
            </div>
          )}
        </div>

        {geoErr && (
          <div style={{ flexBasis: '100%', font: '600 12px var(--jakarta)', color: '#ff9a9a', textAlign: 'right' }}>{geoErr}</div>
        )}
      </div>
    </header>
  );
}

const navBtnStyle: React.CSSProperties = {
  appearance: 'none',
  cursor: 'pointer',
  border: 'none',
  background: 'rgba(255,255,255,.08)',
  color: '#cdd8e6',
  borderRadius: 16,
  padding: '8px 13px',
  font: '600 13px var(--jakarta)',
  whiteSpace: 'nowrap',
  display: 'inline-flex',
  alignItems: 'center',
};
