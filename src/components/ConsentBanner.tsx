'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// LGPD cookie-consent banner wired to Google Consent Mode v2. Consent defaults to
// "denied" (set in Analytics.tsx before gtag config); this banner lets the user
// grant or refuse the non-essential (analytics + ads) cookies and persists the
// choice in localStorage. Accepting/refusing calls gtag('consent','update',…) so
// Google Analytics and AdSense honor it immediately.
const KEY = 'bt_consent';
type Choice = 'granted' | 'denied';

function applyConsent(choice: Choice) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('consent', 'update', {
    ad_storage: choice,
    analytics_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
  });
}

export function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored !== 'granted' && stored !== 'denied') setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  function choose(choice: Choice) {
    try {
      localStorage.setItem(KEY, choice);
    } catch {
      /* storage blocked — choice just won't persist */
    }
    applyConsent(choice);
    setShow(false);
  }

  if (!show) return null;

  const btnBase: React.CSSProperties = {
    appearance: 'none',
    cursor: 'pointer',
    borderRadius: 12,
    padding: '10px 16px',
    font: '700 13px var(--jakarta)',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 200,
        maxWidth: 1040,
        margin: '0 auto',
        background: 'var(--ink)',
        color: '#e6edf5',
        borderRadius: 16,
        boxShadow: '0 14px 40px rgba(20,40,70,.30)',
        padding: '16px 18px',
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: '1 1 300px', font: '500 13px/1.55 var(--jakarta)' }}>
        Usamos cookies para medir a audiência e exibir anúncios. Você pode aceitar ou recusar os
        cookies não essenciais. Saiba mais na{' '}
        <Link href="/cookies" style={{ color: 'var(--blue-light)', textDecoration: 'underline' }}>
          Política de Cookies
        </Link>
        .
      </div>
      <div style={{ display: 'flex', gap: 8, flex: '0 0 auto' }}>
        <button
          onClick={() => choose('denied')}
          style={{ ...btnBase, border: '1px solid #38465a', background: 'transparent', color: '#cdd8e6' }}
        >
          Rejeitar
        </button>
        <button
          onClick={() => choose('granted')}
          style={{ ...btnBase, border: 'none', background: 'var(--blue)', color: '#fff' }}
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
