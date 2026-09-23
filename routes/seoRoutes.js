import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import Post from '../models/Post.js';
import Category from '../models/Category.js';

const router = Router();

// XML sitemap
router.get(
  '/sitemap.xml',
  asyncHandler(async (req, res) => {
    const base = process.env.CLIENT_URL || 'https://example.com';
    const [posts, categories] = await Promise.all([
      Post.find({ status: 'published' }).select('slug updatedAt').sort({ publishedAt: -1 }),
      Category.find().select('slug updatedAt'),
    ]);

    const urls = [
      { loc: base, priority: '1.0', changefreq: 'daily' },
      { loc: `${base}/blog`, priority: '0.9', changefreq: 'daily' },
      { loc: `${base}/categories`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${base}/about`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${base}/contact`, priority: '0.5', changefreq: 'monthly' },
      ...categories.map((c) => ({
        loc: `${base}/category/${c.slug}`,
        priority: '0.7',
        changefreq: 'weekly',
        lastmod: c.updatedAt.toISOString(),
      })),
      ...posts.map((p) => ({
        loc: `${base}/blog/${p.slug}`,
        priority: '0.6',
        changefreq: 'monthly',
        lastmod: p.updatedAt.toISOString(),
      })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  })
);

// robots.txt
router.get('/robots.txt', (req, res) => {
  const base = process.env.CLIENT_URL || 'https://example.com';
  res.set('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${base}/sitemap.xml
`);
});

export default router;
