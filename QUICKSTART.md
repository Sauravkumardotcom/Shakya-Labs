# Shakya Labs Website - Quick Start Guide

## What You Have

A complete, production-ready website for Shakya Labs with:

✅ Modern, professional design
✅ Dark and light theme toggle
✅ Fully responsive (mobile, tablet, desktop)
✅ Beautiful animations
✅ Contact form
✅ Brand logo and assets
✅ SEO optimized
✅ Fast performance

## Getting Started

### 1. View the Website

The website is currently running at:
**http://localhost:5174/**

You can click around, toggle the theme, fill the contact form, and test everything.

### 2. Project Structure

```
shakya-labs/
├── src/
│   ├── App.jsx           ← Main website component
│   ├── App.css           ← Styles and animations
│   ├── index.css         ← Base styles
│   └── main.jsx          ← React entry point
├── public/
│   ├── logo.svg          ← Brand logo
│   └── og-image.svg      ← Social media preview
├── index.html            ← HTML template
├── package.json          ← Dependencies
├── vite.config.js        ← Build configuration
├── tailwind.config.js    ← Tailwind configuration
├── postcss.config.js     ← PostCSS configuration
├── WEBSITE_GUIDE.md      ← Full documentation
├── DEPLOYMENT.md         ← Deployment instructions
├── FEATURES.md           ← Feature reference
└── README.md             ← Project readme
```

## Making Changes

### Change Content

Edit `src/App.jsx` to change:
- Company information
- Services offered
- Philosophy points
- Contact info
- Links

**Example: Change a service**
```javascript
// Around line 235, find the services array:
{ title: "Custom Software Development", icon: "⚙️", desc: "Bespoke applications..." },
// Edit the title, icon, or description
```

### Change Colors

Replace color classes in `src/App.jsx`:
- `indigo-900` → `blue-900`, `purple-900`, `slate-900`, etc.
- `slate-950` → `gray-950`, `zinc-950`, etc.

**Example: Change primary color to blue**
```javascript
// Find all instances of indigo-900 and replace with blue-900
className="text-indigo-900" 
// becomes
className="text-blue-900"
```

### Change Layout

Modify Tailwind classes:
- `grid-cols-2` → `grid-cols-3` (change number of columns)
- `py-20` → `py-32` (change padding)
- `text-4xl` → `text-5xl` (change text size)

### Add New Section

Copy an existing section and customize:

```javascript
{/* New Section */}
<section id="new-section" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
  <div className="max-w-5xl mx-auto">
    <h2 className="text-5xl font-bold mb-16 text-center text-indigo-900">
      Section Title
    </h2>
    {/* Add your content here */}
  </div>
</section>
```

## Customization Tips

### 1. Update Logo
- Replace `public/logo.svg` with your own
- Update the SVG code in `ShyakaLabsLogo` component

### 2. Change Typography
- Font is "Inter" (imported from Google Fonts)
- To use different font: update `App.css` import and `tailwind.config.js`

### 3. Add Images
- Place image files in `public/` folder
- Reference with `<img src="/image-name.png" alt="Description" />`

### 4. Add New Pages/Routes
- Currently single page
- To add routing: install `react-router-dom` and restructure

### 5. Add More Features
- Blog section
- Team profiles
- Case studies
- Pricing table
- Features comparison
- FAQ section

## Deployment

### Quick Deploy (30 seconds)

1. **Netlify Drop**
   - Run: `npm run build`
   - Visit: https://app.netlify.com/drop
   - Drag `dist/` folder to the page
   - Your site is live!

2. **GitHub + Netlify** (recommended)
   - Push code to GitHub
   - Connect repo to Netlify
   - Auto-deploys on every push

See `DEPLOYMENT.md` for detailed instructions.

## Testing

### Test Responsive Design

In browser DevTools:
1. Press F12 (or Ctrl+Shift+I)
2. Click device toggle icon (top left)
3. Select mobile/tablet/desktop
4. Test all sections

### Test Dark Mode

Click the 🌙 button in header to toggle theme.

### Test Contact Form

1. Fill in the form
2. Click "Send Message"
3. Check browser console (F12 → Console tab)
4. Should see form data logged

## Common Tasks

### Update Company Info

In `App.jsx`, find and update:
- Company name: "Shakya Labs"
- Tagline: "Ancient Wisdom. Modern Engineering."
- Description text in hero section
- Services list
- Why us points

### Add Social Links

Update footer section:
```javascript
<li><a href="https://linkedin.com/company/shakya-labs">LinkedIn</a></li>
```

### Change Theme Colors

In tailwind.config.js, extend colors:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#1e40af',
      secondary: '#312e81',
    }
  }
}
```

### Improve Performance

1. Optimize images: use WebP format
2. Add lazy loading: `<img loading="lazy" />`
3. Minify SVGs
4. Use CSS for animations instead of JS

## Troubleshooting

### Website not updating after changes

1. Save the file (Ctrl+S)
2. Check if hot reload happened (look for notification in terminal)
3. Refresh browser (F5 or Ctrl+R)
4. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Dark mode not working

Check that `isDark` state is being used correctly:
```javascript
const [isDark, setIsDark] = useState(false)
// Dark mode class should be applied to root div
className={`... ${isDark ? 'dark' : ''}`}
```

### Styles not applying

1. Ensure Tailwind is imported in CSS: `@import "tailwindcss";`
2. Check class names are spelled correctly
3. Clear cache: Delete `.next`, `node_modules/.cache`
4. Restart dev server

### Form not submitting

1. Open DevTools Console (F12)
2. Check for JavaScript errors
3. See `DEPLOYMENT.md` for backend setup

## Next Steps

### Short Term (This Week)
- [ ] Customize content with your information
- [ ] Change colors to match your brand
- [ ] Add your own logo
- [ ] Test on mobile device

### Medium Term (This Month)
- [ ] Set up contact form backend
- [ ] Deploy to production
- [ ] Add custom domain
- [ ] Set up analytics

### Long Term (This Quarter)
- [ ] Add blog section
- [ ] Add team profiles
- [ ] Add case studies
- [ ] Implement newsletter signup

## Getting Help

### Documentation
- `WEBSITE_GUIDE.md` - Complete feature guide
- `DEPLOYMENT.md` - Deployment instructions
- `FEATURES.md` - Detailed feature reference

### Online Resources
- Tailwind CSS: https://tailwindcss.com/docs
- React: https://react.dev
- Vite: https://vitejs.dev

### Common Questions

**Q: Can I add a blog?**
A: Yes! Create a new section with blog posts, or use a headless CMS like Sanity, Contentful, or Ghost.

**Q: Can I add e-commerce?**
A: Yes! Integrate with Stripe, PayPal, or Shopify.

**Q: Can I add a newsletter?**
A: Yes! Use Mailchimp, ConvertKit, or Beehiiv.

**Q: Can I add search?**
A: For single page, use Ctrl+F browser search. For multiple pages, add Algolia search.

---

## You're All Set! 🚀

Your Shakya Labs website is complete and ready to customize. 

**Start by:**
1. Changing the content in `App.jsx`
2. Updating colors to match your brand
3. Adding your logo
4. Deploying to production

**Questions?** Check the documentation files or visit the online resources.

Happy building! 🎉
