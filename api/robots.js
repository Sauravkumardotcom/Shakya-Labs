module.exports = function handler(req, res) {
  const robots = `# Shakya Labs - Robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /node_modules/
Disallow: /*.js$
Disallow: /*.css$
Disallow: /*.json$

User-agent: Googlebot
Crawl-delay: 0

User-agent: Bingbot
Crawl-delay: 1

User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

Sitemap: https://shakyalabs.com/api/sitemap`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(robots);
};
