# SEO Configuration for Shakya Labs

This document outlines the SEO setup for the Shakya Labs website deployed on Vercel at https://shakyalabs.com

## Overview

The website implements comprehensive SEO best practices to ensure optimal crawlability and indexability by search engines.

## Files and Configuration

### 1. **robots.txt** (`public/robots.txt`)
- Located in the public folder, automatically copied to `dist/` during build
- Serves at: `https://shakyalabs.com/robots.txt`
- Allows all search engines to crawl public pages
- Blocks API routes and unnecessary resources (JS, CSS files)
- Specifies crawl delays and request rates for different bots
- Blocks undesirable crawlers (AhrefsBot, SemrushBot, etc.)
- Points to sitemap.xml location

### 2. **sitemap.xml** (`dist/sitemap.xml`)
- Automatically generated during build via `vite-plugin-sitemap`
- Serves at: `https://shakyalabs.com/sitemap.xml`
- XML format compatible with Google, Bing, and other search engines
- Includes:
  - Homepage (/) - Priority: 1.0, Weekly updates
  - Birthday page (/birthday) - Priority: 0.8, Yearly updates
  - Last modification timestamps
  - Change frequency hints
- Human-readable format for debugging

### 3. **Meta Tags** (`index.html`)
- **Canonical URL**: Prevents duplicate content issues
- **Open Graph Tags**: Improves social media sharing (Facebook, LinkedIn)
- **Twitter Card Tags**: Optimizes Twitter/X sharing
- **Robots Meta Tag**: Directs search engines to index and follow links
- **Viewport & Mobile**: Ensures mobile-first indexing
- **Title & Description**: Optimized for click-through rate (CTR)

### 4. **Vite Configuration** (`vite.config.js`)
- Uses `vite-plugin-sitemap` for automatic sitemap generation
- Configured for production domain: `https://shakyalabs.com`
- Routes explicitly defined with SEO metadata:
  - Change frequency (weekly, yearly)
  - Priority scores (1.0 = highest)
  - Last modification dates

### 5. **Vercel Configuration** (`vercel.json`)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```
- Framework auto-detection ensures optimal Vercel deployment
- Output directory set to Vite's default `dist/`
- Vercel automatically handles redirects and headers for static assets

## Search Engine Integration

### Google Search Console
1. Verify domain ownership
2. Submit sitemap: `https://shakyalabs.com/sitemap.xml`
3. Monitor crawl errors and indexing status
4. Check Core Web Vitals

### Bing Webmaster Tools
1. Verify domain ownership
2. Submit sitemap
3. Monitor crawl statistics

### Other Considerations
- **Crawl Budget**: robots.txt optimized to avoid unnecessary crawling
- **Structured Data**: Consider adding Schema.org markup for services
- **Performance**: Vite ensures fast build times and optimal bundle sizes
- **Mobile**: Tailwind CSS provides responsive design out of the box

## Dynamic Routes

To add more routes to the sitemap, update `vite.config.js`:

```javascript
routes: [
  { url: '/', changefreq: 'weekly', priority: 1.0 },
  { url: '/birthday', changefreq: 'yearly', priority: 0.8 },
  // Add more routes here
]
```

## Build Output

After running `npm run build`, verify:
- `dist/sitemap.xml` exists and is valid
- `dist/robots.txt` exists
- `dist/index.html` contains all meta tags
- No build warnings or errors

## Testing SEO

### Local Testing
1. Run `npm run build`
2. Verify files exist in `dist/` folder
3. Check `sitemap.xml` XML validity
4. Verify `robots.txt` rules

### Production Testing
1. Use Google Search Console to test crawlability
2. Validate sitemap: https://shakyalabs.com/sitemap.xml
3. Verify robots.txt: https://shakyalabs.com/robots.txt
4. Check meta tags in browser DevTools

## Performance Metrics

- **Build Time**: ~10 seconds
- **Sitemap Size**: ~500 bytes (minimal, but scalable)
- **Robots.txt Size**: ~1KB
- **No Additional Runtime Overhead**: All SEO files generated at build time

## Security & Compliance

- No sensitive data exposed in robots.txt or sitemap
- API routes properly blocked from search crawlers
- No authentication required for public pages
- GDPR/Privacy compliant (no tracking code)

## Future Enhancements

1. Add Schema.org structured data (Organization, Service, Article)
2. Implement breadcrumb navigation
3. Add Open Graph images for better social sharing
4. Monitor Core Web Vitals and optimize
5. Create blog/resources section with auto-sitemap updates
6. Implement hreflang tags for multi-language support (if needed)

---

**Last Updated**: January 30, 2026
**Deployment**: Vercel (https://shakyalabs.com)
**Framework**: React 18 + Vite 5
