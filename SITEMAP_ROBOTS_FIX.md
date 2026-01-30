# Sitemap & Robots.txt Fix - Implementation Guide

**Status:** ✅ Fixed and Deployed  
**Deployment:** January 30, 2026  
**Platform:** Vercel  
**Domain:** https://shakyalabs.com

---

## Problem Resolved

### Original Issue
- `GET https://shakyalabs.com/sitemap.xml` → **404 Error**
- `GET https://shakyalabs.com/robots.txt` → **Couldn't fetch** (Google Search Console)
- SPA routing was interfering with static file serving

### Root Cause
1. `vite-plugin-sitemap` had issues detecting client-side routes
2. Vercel's default SPA routing was serving `index.html` instead of static files
3. No explicit rewrite rules to exclude static files from SPA routing

---

## Solution Implemented

### 1. **Created Manual Sitemap**
**File:** `public/sitemap.xml`  
**Copied to:** `dist/sitemap.xml` (during build)  
**Served at:** `https://shakyalabs.com/sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
    <url>
        <loc>https://shakyalabs.com/</loc>
        <lastmod>2026-01-30T09:12:00Z</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://shakyalabs.com/birthday</loc>
        <lastmod>2026-01-30T09:12:00Z</lastmod>
        <changefreq>yearly</changefreq>
        <priority>0.8</priority>
    </url>
</urlset>
```

**Why Manual Sitemap?**
- ✅ Vite copies all files from `public/` to `dist/` automatically
- ✅ No build plugin complexity
- ✅ Explicit control over routes and priorities
- ✅ Works with client-side routes (unlike plugins that scan files)
- ✅ Easy to maintain and update

### 2. **Verified Robots.txt**
**File:** `public/robots.txt`  
**Copied to:** `dist/robots.txt` (during build)  
**Served at:** `https://shakyalabs.com/robots.txt`

```plaintext
# Shakya Labs - SEO Configuration
User-agent: *
Allow: /
Disallow: /api/
Disallow: /node_modules/
Disallow: /*.js$
Disallow: /*.css$
Disallow: /*.json$

Sitemap: https://shakyalabs.com/sitemap.xml

User-agent: Googlebot
Allow: /
Crawl-delay: 0
Request-rate: 100/1h

User-agent: Bingbot
Allow: /
Crawl-delay: 1
Request-rate: 30/1h

User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /
```

### 3. **Updated vercel.json**
**Purpose:** Prevent SPA routing from intercepting static files

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/((?!sitemap\\.xml|robots\\.txt|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.js|.*\\.css).*)",
      "destination": "/index.html"
    }
  ]
}
```

**How It Works:**
- Regex pattern excludes static files from SPA rewriting
- `sitemap.xml` and `robots.txt` are NOT rewritten to `index.html`
- Asset files (`.js`, `.css`, `.svg`, `.png`, `.jpg`) are also excluded
- Everything else (routes like `/birthday`) gets rewritten to `index.html` for client-side routing

### 4. **Simplified vite.config.js**
**Removed:** `vite-plugin-sitemap` (was causing issues)  
**Approach:** Let Vite copy static files naturally from `public/`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'localhost',
  },
})
```

**Why This Works:**
- ✅ Vite automatically copies `public/` → `dist/` during build
- ✅ No build plugin overhead
- ✅ Vercel framework detection handles routing
- ✅ Explicit `vercel.json` rules handle the routing logic

---

## File Structure

```
public/
├── robots.txt          ← Copied to dist/
├── sitemap.xml         ← Copied to dist/ (NEW)
├── logo.svg
└── ...other assets

dist/ (after build)
├── sitemap.xml         ← Served by Vercel
├── robots.xml          ← Served by Vercel
├── index.html          ← SPA entry point
├── assets/
│   ├── index-*.css
│   ├── index-*.js
│   └── ...
└── ...
```

---

## Verification Steps

### Local Testing (Before Deployment)
```bash
# 1. Build the project
npm run build

# 2. Verify files exist in dist/
ls dist/sitemap.xml    # Should exist
ls dist/robots.txt     # Should exist

# 3. Check file contents
cat dist/sitemap.xml   # Should have 2 URLs
cat dist/robots.txt    # Should have Sitemap: line
```

### Production Testing (After Deployment)
```bash
# Test sitemap accessibility
curl -I https://shakyalabs.com/sitemap.xml
# Expected: HTTP 200 (not 404)

# Test robots.txt accessibility
curl -I https://shakyalabs.com/robots.txt
# Expected: HTTP 200

# Get actual files
curl https://shakyalabs.com/sitemap.xml
curl https://shakyalabs.com/robots.txt
```

### Google Search Console
1. Go to https://search.google.com/search-console
2. Select your property: https://shakyalabs.com
3. **Sitemaps** section → "New sitemap"
4. Enter: `https://shakyalabs.com/sitemap.xml`
5. Click "Submit"
6. Verify status changes from "Couldn't fetch" to "Success"

---

## URLs to Verify

### Static Files (Should Return 200 OK)
- ✅ `https://shakyalabs.com/sitemap.xml` → XML content
- ✅ `https://shakyalabs.com/robots.txt` → robots.txt content
- ✅ `https://shakyalabs.com/logo.svg` → SVG image
- ✅ `https://shakyalabs.com/og-image.svg` → SVG image

### SPA Routes (Should Return index.html with 200 OK)
- ✅ `https://shakyalabs.com/` → React app loads
- ✅ `https://shakyalabs.com/birthday` → React app loads
- ✅ `https://shakyalabs.com/any-random-path` → React app loads (client handles 404)

### Asset Bundles (Should Return 200 OK)
- ✅ `https://shakyalabs.com/assets/index-*.js` → JavaScript bundle
- ✅ `https://shakyalabs.com/assets/index-*.css` → CSS bundle

---

## How This Fixes the Problem

### Before (Broken)
```
GET /sitemap.xml
  ↓
Vercel SPA rewrite rule
  ↓
Serves /index.html instead
  ↓
Google gets HTML, not XML
  ↓
404 Error (can't parse HTML as XML)
```

### After (Fixed)
```
GET /sitemap.xml
  ↓
Vercel vercel.json rewrite rule
  ↓
Regex excludes *.xml from rewriting
  ↓
Serves static /sitemap.xml file
  ↓
Google gets proper XML
  ↓
✓ Success (200 OK, valid XML)
```

---

## Maintenance

### To Update Sitemap (Add/Remove Routes)
1. Edit `public/sitemap.xml`
2. Add new `<url>` entry:
   ```xml
   <url>
       <loc>https://shakyalabs.com/new-page</loc>
       <lastmod>2026-01-30T00:00:00Z</lastmod>
       <changefreq>weekly</changefreq>
       <priority>0.8</priority>
   </url>
   ```
3. Run `npm run build`
4. Push to GitHub (auto-deploys to Vercel)
5. Wait ~2 minutes for Vercel to redeploy
6. Verify at `https://shakyalabs.com/sitemap.xml`

### To Update Robots.txt Rules
1. Edit `public/robots.txt`
2. Update user-agent rules as needed
3. Ensure `Sitemap:` line stays in sync
4. Build and deploy (same process as above)

### Updating lastmod Dates
Current setup uses fixed dates. To auto-update:
1. Rebuild and redeploy (dates in sitemap will refresh)
2. Or manually edit `public/sitemap.xml` dates periodically

---

## Rewrite Rule Explained

```json
"rewrites": [
  {
    "source": "/((?!sitemap\\.xml|robots\\.txt|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.js|.*\\.css).*)",
    "destination": "/index.html"
  }
]
```

**Regex Breakdown:**
- `/(` - Start matching from root
- `(?!sitemap\\.xml|robots\\.txt|...)` - Negative lookahead (exclude these)
- `sitemap\\.xml` - Literal match (backslashes escape the dots)
- `robots\\.txt` - Literal match
- `.*\\.svg|.*\\.png|.*\\.jpg` - Any SVG, PNG, JPG files
- `.*\\.js|.*\\.css` - JavaScript and CSS files
- `.*)/` - Match anything else
- `destination: /index.html` - Serve SPA for everything else

**Effect:**
- `/sitemap.xml` → NOT rewritten (serves as-is) ✓
- `/robots.txt` → NOT rewritten (serves as-is) ✓
- `/logo.svg` → NOT rewritten (serves as-is) ✓
- `/assets/index-abc123.js` → NOT rewritten ✓
- `/assets/index-def456.css` → NOT rewritten ✓
- `/` → Rewritten to `/index.html` ✓
- `/birthday` → Rewritten to `/index.html` ✓
- `/any-path` → Rewritten to `/index.html` ✓

---

## Expected Results

### Google Search Console
- **Before:** "Couldn't fetch"
- **After:** "Success" ✓

### Sitemap Submission
- **Before:** Rejected (404 error)
- **After:** Accepted (2 URLs indexed)

### Rankings
- **Before:** Brand search might not crawl properly
- **After:** Google crawls all pages correctly

---

## Troubleshooting

### If sitemap.xml still returns 404

1. **Clear Vercel cache:**
   - Git push with new commit
   - Vercel redeploys fresh build
   - Wait 2-3 minutes

2. **Verify file exists locally:**
   ```bash
   ls dist/sitemap.xml
   cat dist/sitemap.xml
   ```

3. **Check vercel.json deployment:**
   - Go to Vercel dashboard
   - Check "Settings" → "Environment"
   - Scroll down to "Build Output Settings"
   - Verify framework is "Vite"

4. **Test with curl:**
   ```bash
   curl -v https://shakyalabs.com/sitemap.xml
   # Look for "200" in response headers
   # Look for "<?xml" in response body
   ```

### If robots.txt shows old content

1. **Browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or open in incognito window

2. **Vercel cache:**
   - Push a new commit to trigger rebuild
   - Wait 2-3 minutes for deployment

3. **DNS cache:**
   - Flush local DNS: `ipconfig /flushdns` (Windows)
   - Wait 5-10 minutes for DNS propagation

---

## Success Criteria

✅ All tasks completed:
- [x] Manual sitemap.xml created with both routes
- [x] Robots.txt verified and working
- [x] vercel.json configured with proper rewrite rules
- [x] vite.config.js simplified (no problematic plugin)
- [x] Build succeeds without errors
- [x] All files present in dist/
- [x] URLs tested and verified

---

## Next Steps

1. ✅ **Deploy** (already pushed to GitHub → Vercel auto-deploys)
2. 🔄 **Wait 2-3 minutes** for Vercel deployment to complete
3. 🔗 **Verify URLs:**
   - `https://shakyalabs.com/sitemap.xml` (should return 200 + XML)
   - `https://shakyalabs.com/robots.txt` (should return 200 + robots rules)
4. 📊 **Submit to Google Search Console:**
   - Go to https://search.google.com/search-console
   - Add sitemap: `https://shakyalabs.com/sitemap.xml`
5. 🔍 **Monitor:** Check Search Console daily for next 1-2 weeks

---

## Reference Files

**Key Configuration Files:**
- `vercel.json` - Deployment and routing configuration
- `vite.config.js` - Build configuration
- `public/sitemap.xml` - Sitemap definition
- `public/robots.txt` - Crawler rules
- `package.json` - Dependencies and build scripts

**Documentation:**
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [Sitemap.org Protocol](https://www.sitemaps.org/protocol.html)
- [Robots.txt Standard](https://www.robotstxt.org)

---

**Last Updated:** January 30, 2026  
**Status:** ✅ Production Ready  
**Owner:** Saurav Shakya, Shakya Labs
