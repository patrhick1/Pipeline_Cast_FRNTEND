import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base URL for the site
const SITE_URL = process.env.VITE_SITE_URL || 'https://podcastguestlaunch.com';

// Static routes that should be included in sitemap
const routes = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/bookings', changefreq: 'monthly', priority: 0.9 },
  { path: '/case-studies', changefreq: 'weekly', priority: 0.8 },
  { path: '/blog', changefreq: 'weekly', priority: 0.8 },
  { path: '/about-us', changefreq: 'monthly', priority: 0.6 },
  { path: '/privacy', changefreq: 'yearly', priority: 0.3 },
  { path: '/terms', changefreq: 'yearly', priority: 0.3 },
  { path: '/contact', changefreq: 'monthly', priority: 0.5 },
];

// Generate sitemap XML
const generateSitemap = () => {
  const lastmod = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const urls = routes
    .map((route) => {
      return `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
    })
    .join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return sitemap;
};

// Write sitemap to public directory
const sitemapPath = join(__dirname, '..', 'client', 'public', 'sitemap.xml');
const sitemap = generateSitemap();

writeFileSync(sitemapPath, sitemap, 'utf-8');
console.log('✅ Sitemap generated successfully at client/public/sitemap.xml');
