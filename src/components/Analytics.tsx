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
var __btGranted = false;
try { __btGranted = localStorage.getItem('bt_consent') === 'granted'; } catch (e) {}
gtag('consent', 'default', {
  ad_storage: __btGranted ? 'granted' : 'denied',
  analytics_storage: __btGranted ? 'granted' : 'denied',
  ad_user_data: __btGranted ? 'granted' : 'denied',
  ad_personalization: __btGranted ? 'granted' : 'denied',
  wait_for_update: 500
});
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
