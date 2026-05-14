import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/santri', '/login'],
    },
    sitemap: 'https://ppdb.markazarabiyah.site/sitemap.xml',
  }
}
