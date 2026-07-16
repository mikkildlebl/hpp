import type { MetadataRoute } from 'next';

const SITE_URL = 'https://hppro.se';

// Only the marketing/legal pages have anything for an anonymous crawler to
// see - everything under (app) and /session redirects to /login without a
// session, so there's no public content behind them to index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/villkor', '/integritetspolicy'],
      disallow: ['/ova', '/konto', '/statistik', '/glossary', '/session', '/auth'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
