import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/console/', '/_next/'],
      },
    ],
    sitemap: 'https://membrane-api.com/sitemap.xml',
  };
}
