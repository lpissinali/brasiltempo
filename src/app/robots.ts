import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// robots.txt. Allow crawling of all content pages; keep crawlers out of the API
// routes (forecast/geocode/AI endpoints) since they aren't pages and burn budget
// + serve no SEO value. Point crawlers at the sitemap and declare the canonical
// host so www/preview hostnames don't fragment indexing.
export default function robots(): MetadataRoute.Robots {
  const base = SITE.replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/api/',
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
