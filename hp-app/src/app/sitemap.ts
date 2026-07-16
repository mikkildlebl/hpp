import type { MetadataRoute } from 'next';

const SITE_URL = 'https://hppro.se';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${SITE_URL}/villkor`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/integritetspolicy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
