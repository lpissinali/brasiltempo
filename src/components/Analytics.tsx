import Script from 'next/script';

// Google Analytics 4. The Measurement ID comes from NEXT_PUBLIC_GA_ID (inlined at
// build time). Rendered only in production with an ID present, so local `npm run
// dev` never sends hits and pollutes the property. `afterInteractive` loads the
// tag without blocking first paint.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function Analytics() {
  if (!GA_ID || process.env.NODE_ENV !== 'production') return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
