import type { MetadataRoute } from 'next';
import { CITIES } from '@/lib/cities';
import { POSTS } from '@/lib/posts';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Dynamic sitemap. Lists the stable, crawlable routes: home, blog, and the
// curated city pages (clean SEO slugs). Long-tail searched cities are resolved
// dynamically from query params and intentionally NOT listed here — they aren't
// canonical URLs and listing them would risk thin / scaled-content signals.
// `lastModified` is set to build time; forecasts revalidate every 30 min, so the
// content is always fresh regardless of this timestamp.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base = SITE.replace(/\/$/, '');

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ];

  // Legal / institucional pages — stable, low churn.
  const legalRoutes: MetadataRoute.Sitemap = ['/privacidade', '/cookies', '/termos'].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: 'yearly',
    priority: 0.3,
  }));

  const cityRoutes: MetadataRoute.Sitemap = CITIES.map((c) => ({
    url: `${base}/cidade/${c.slug}`,
    lastModified: now,
    changeFrequency: 'hourly',
    priority: 0.8,
  }));

  // Evergreen blog posts — use each post's own date for lastModified.
  const blogRoutes: MetadataRoute.Sitemap = POSTS.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.updated || p.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...cityRoutes, ...blogRoutes, ...legalRoutes];
}
