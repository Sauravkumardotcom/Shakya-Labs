# Shakya Labs - Deployment Guide

## Quick Start

Your Shakya Labs website is ready for production. Follow these steps to deploy it to the world.

## Pre-Deployment Checklist

- [x] Dark/Light theme working
- [x] All sections responsive
- [x] Contact form functional (logs to console)
- [x] Logo and branding complete
- [x] SEO metadata added
- [ ] Contact form backend configured
- [ ] Analytics setup
- [ ] Domain configured

## Option 1: Deploy to Netlify (Recommended)

### Via Git Repository

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Shakya Labs website"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/shakya-labs.git
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Select GitHub and authorize
   - Choose your repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

3. **Configure domain** (optional)
   - In Netlify settings, add your custom domain
   - Update DNS records at your domain registrar

### Via Netlify Drop

1. Run `npm run build`
2. Drag and drop the `dist/` folder to [netlify.com/drop](https://netlify.com/drop)

## Option 2: Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. Follow prompts to configure and deploy

4. **Custom domain** (in Vercel dashboard)
   - Add your domain
   - Update DNS records

## Option 3: Deploy to GitHub Pages

1. **Update vite.config.js**
   ```javascript
   export default {
     base: '/shakya-labs/', // or '/' if using custom domain
     plugins: [react()],
   }
   ```

2. **Build and deploy**
   ```bash
   npm run build
   git add dist
   git commit -m "Deploy to GitHub Pages"
   git push
   ```

3. **Enable GitHub Pages**
   - Repository settings → Pages
   - Select "Deploy from a branch"
   - Choose "main" branch and "/root" folder

## Configuration for Production

### 1. Environment Variables

Create a `.env.production` file:

```env
VITE_APP_NAME=Shakya Labs
VITE_API_URL=https://api.yourdomain.com
```

### 2. Contact Form Integration

Update the `handleSubmit` function in `App.jsx`:

**Using Formspree:**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault()
  try {
    const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: { 'Content-Type': 'application/json' }
    })
    if (response.ok) {
      setFormSubmitted(true)
      setFormData({ name: '', email: '', message: '' })
      setTimeout(() => setFormSubmitted(false), 5000)
    }
  } catch (error) {
    console.error('Form error:', error)
  }
}
```

**Using SendGrid:**
```javascript
// Server-side handler needed
const response = await fetch('/api/send-email', {
  method: 'POST',
  body: JSON.stringify(formData)
})
```

### 3. Analytics

Add Google Analytics to `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 4. SEO Meta Tags

Already configured in `index.html`. Update:
- Title and description
- OG image (upload to `/public/og-image.png`)
- Schema markup (optional)

## Performance Optimization

### Image Optimization
Replace SVG placeholders with optimized images:

```javascript
// In App.jsx, replace SVG sections with:
<img src="/images/illustration.webp" alt="Illustration" loading="lazy" />
```

### Build Analysis
```bash
npm install -D rollup-plugin-visualizer
# Then add to vite.config.js and run build
```

### Caching Headers
Set in deployment platform (Netlify/Vercel):
- HTML: No cache (Cache-Control: no-cache)
- CSS/JS: 1 year cache
- Images: 30 days cache

## SSL/HTTPS

- Netlify/Vercel provide free SSL by default
- Always use HTTPS for production
- Update SEO canonical URLs to HTTPS

## Monitoring & Maintenance

### Key Metrics to Monitor
- Core Web Vitals (PageSpeed Insights)
- Error tracking (Sentry)
- Uptime monitoring (Pingdom, Uptime Robot)
- Form submissions and failures

### Regular Updates
- Update React and dependencies: `npm update`
- Review security: `npm audit`
- Test on multiple browsers
- Monitor analytics data

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf dist node_modules package-lock.json
npm install
npm run build
```

### Dark mode not persisting
Add localStorage in `App.jsx`:
```javascript
useEffect(() => {
  const saved = localStorage.getItem('theme')
  if (saved) setIsDark(saved === 'dark')
}, [])

useEffect(() => {
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
}, [isDark])
```

### Contact form not working
- Check browser console for errors
- Verify form backend is configured
- Test with form service (Formspree, etc.)
- Add error handling and logging

## Domain Setup

### Buy a Domain
- GoDaddy, Namecheap, Google Domains, etc.

### Point to Deployment
- **Netlify/Vercel**: Add CNAME record
- **GitHub Pages**: Add A records pointing to GitHub IPs

### Email Setup (optional)
Configure email forwarding or set up email service:
- Zoho Mail (free)
- Google Workspace
- SendGrid for transactional emails

## Backup & Version Control

```bash
# Backup current state
git tag v1.0.0
git push --tags

# Create release
gh release create v1.0.0 --generate-notes
```

## Cost Estimate

- **Hosting**: Free (Netlify/Vercel)
- **Domain**: $10-15/year
- **Email**: Free-$6/month
- **Form service**: Free for basic

**Total**: ~$0-30/year

## Next Steps

1. [ ] Configure contact form backend
2. [ ] Set up analytics
3. [ ] Add custom domain
4. [ ] Test on production
5. [ ] Monitor performance
6. [ ] Plan content updates

---

**Your Shakya Labs website is ready to launch!**
