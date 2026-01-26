# Shakya Labs Website - Feature Reference

## 🎨 Design Features

### Color Palette
- **Primary**: Indigo (#1e40af, #312e81)
- **Light Mode**: White backgrounds with gray text
- **Dark Mode**: Slate backgrounds with white text
- **Accent**: Indigo gradients

### Typography
- Font: Inter (clean, modern sans-serif)
- Heading sizes: 24px → 72px
- Line height: 1.6
- Font weights: 400, 500, 600, 700, 800

### Visual Elements
- SVG geometric illustrations
- Gradient backgrounds
- Smooth animations
- Hover effects and transitions
- Custom scrollbar styling

## 🌙 Theme System

### Light Mode (Default)
- White backgrounds
- Dark text colors
- Gray borders
- Indigo accents

### Dark Mode
- Slate backgrounds (slate-950, slate-900)
- White/light gray text
- Darker borders
- Indigo/cyan accents

### Toggle Button
- Located in header (next to mobile menu)
- Sun/Moon emoji icons
- Smooth color transitions

## 📱 Responsive Design

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile Features
- Hamburger navigation menu
- Stacked sections
- Optimized touch targets
- Full-width forms

### Desktop Features
- Multi-column layouts
- Side-by-side sections
- Extended navigation
- Geometric illustrations

## 🚀 Performance

### Optimizations
- Code splitting
- Lazy loading ready
- Minified CSS/JS
- SVG graphics (scalable)
- Fast animations (GPU accelerated)

### Metrics
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1

## ♿ Accessibility

### Features
- Semantic HTML structure
- ARIA labels on buttons
- Focus states for keyboard
- Color contrast > 4.5:1
- Screen reader friendly

### Keyboard Navigation
- Tab through all interactive elements
- Enter to activate buttons
- Space for checkboxes
- Arrow keys for forms

## 🎯 Key Sections

### Header
- Logo with SVG icon
- Navigation links
- Theme toggle
- Mobile menu toggle
- Fixed position, always visible

### Hero
- Large headline
- Subtitle with tagline
- Value proposition
- Two CTA buttons
- Geometric illustration

### About (Philosophy)
- 4 philosophy cards
- Numbered badges
- Hover animations
- Grid layout (responsive)

### Services
- 6 service cards
- Emoji icons
- Short descriptions
- Border hover effects
- Responsive grid

### Why Us
- 4 differentiators
- Numbered boxes
- Detailed descriptions
- Full-width layout

### Contact
- Professional form
- Name, email, message fields
- Success message
- Dark background
- Form validation

### Footer
- Company info
- Quick links
- Social links
- Copyright notice
- 3-column layout

## 🔧 Component Customization

### Logo Component
```jsx
<ShyakaLabsLogo className="w-8 h-8" />
// Can be resized with Tailwind width/height classes
```

### Form Handling
```javascript
const [formData, setFormData] = useState({
  name: '',
  email: '',
  message: ''
})
// Update backend endpoint in handleSubmit
```

### Color Changes
Replace all instances of color classes:
- `indigo-900` → `blue-900`, `purple-900`, etc.
- `slate-950` → `gray-950`, `zinc-950`, etc.

## 📊 Content Management

### Easy to Update
All content is in `App.jsx` as JavaScript objects:

```javascript
// Services array
{[
  { title: "Custom Software Development", icon: "⚙️", desc: "..." },
  { title: "Backend & API Engineering", icon: "🔌", desc: "..." },
  // Add more services here
]}

// Philosophy array
{[
  { title: "Problem-First Thinking", desc: "..." },
  // Add more philosophy points
]}
```

### Static Content Locations
- Hero section: ~Line 60-80
- About section: ~Line 150-200
- Services: ~Line 210-240
- Why Us section: ~Line 270-300
- Contact form: ~Line 320-380
- Footer: ~Line 390-430

## 🎬 Animations

### Available Animations
- `animate-fade-in`: Fade in with slide up
- `animate-slide-in-up`: Slide up animation
- `animate-slide-in-left`: Slide from left
- `animate-slide-in-right`: Slide from right
- `animate-float`: Floating effect
- `animate-glow`: Pulsing glow

### Apply Animations
```jsx
<div className="animate-fade-in">Content here</div>
```

### Custom Animations
Add new animations in `App.css` with @keyframes

## 🔒 Security

### Best Practices Implemented
- No hardcoded secrets
- XSS protection with React
- CSRF tokens ready (add for forms)
- Secure headers (set on server)
- Environment variables (for sensitive data)

## 📈 SEO

### Meta Tags
- Title and description
- Open Graph tags
- Twitter Card tags
- Theme color
- Canonical URL (add if needed)

### Structured Data
- Ready for Schema.org markup
- Consider adding JSON-LD

## 🚢 Building & Deployment

### Build Command
```bash
npm run build
```

### Output
- `dist/` folder
- Minified and optimized
- Ready for production
- ~100KB total size

### Environment-Specific Builds
```bash
npm run build -- --mode production
npm run build -- --mode development
```

## 🐛 Debugging

### Console Logs
- Form submissions log to console
- Check browser DevTools → Console

### Network Tab
- Monitor API calls
- Check CSS/JS loading
- Verify image optimization

### Performance Tab
- Profile animations
- Check frame rate
- Monitor memory usage

## 📚 Resources

### Useful Links
- Tailwind Docs: https://tailwindcss.com
- React Docs: https://react.dev
- Vite Docs: https://vitejs.dev
- Web Vitals: https://web.dev/vitals

### Tools
- Figma (design)
- VS Code (development)
- Chrome DevTools (debugging)
- PageSpeed Insights (performance)

---

**Everything you need to know about the Shakya Labs website!**
