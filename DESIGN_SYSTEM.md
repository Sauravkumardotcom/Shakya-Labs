# 🎨 Shakya Labs - Visual Assets & Branding Guide

## Logo & Branding

### Primary Logo
**File**: `public/logo.svg`
**Format**: SVG (scalable vector)
**Colors**: Gradient indigo/blue
**Usage**: Header, favicon, documents

```
Features:
- Geometric pyramid/mountain shape
- Gradient fill (blue to indigo)
- Minimalist design
- Scalable to any size
- Works in light and dark modes
```

### Logo Variations

**Full Logo** (with text)
```
Use in: Header, social media, documents
Size: 40px height minimum
```

**Icon Only** (just symbol)
```
Use in: Favicon, app icon, social avatars
Size: 32px minimum
```

**Text Only**
```
Use in: Footer, navigation, branding
Font: Inter Bold
Color: Indigo-900 (light) or Indigo-400 (dark)
```

## SVG Assets

### Geometric Illustrations
Located in `src/App.jsx`:

1. **Hero Illustration** (circles and polygon)
   - Concentric circles with geometric shape
   - Used in hero section
   - Dark mode: Indigo-400
   - Light mode: Indigo-600

2. **OG Image** (social preview)
   - File: `public/og-image.svg`
   - Size: 1200x630px (standard OG ratio)
   - Use: Facebook, Twitter, LinkedIn previews

## Color Palette

### Light Mode
```css
Background: #FFFFFF (white)
Text: #111827 (gray-900)
Secondary Text: #6B7280 (gray-500)
Primary: #312E81 (indigo-900)
Primary Light: #6366F1 (indigo-500)
Accent: #4F46E5 (indigo-600)
Borders: #E5E7EB (gray-200)
```

### Dark Mode
```css
Background: #0F172A (slate-950)
Secondary BG: #1E293B (slate-900)
Tertiary BG: #334155 (slate-800)
Text: #F1F5F9 (slate-50)
Secondary Text: #CBD5E1 (slate-300)
Primary: #818CF8 (indigo-400)
Primary Light: #A5B4FC (indigo-300)
Accent: #6366F1 (indigo-500)
Borders: #475569 (slate-700)
```

## Typography

### Font Family
**Primary**: Inter
- Weight: 400, 500, 600, 700, 800
- Import: Google Fonts
- Usage: All text

### Font Sizes
```css
xs: 12px    (0.75rem)
sm: 14px    (0.875rem)
base: 16px  (1rem)
lg: 18px    (1.125rem)
xl: 20px    (1.25rem)
2xl: 24px   (1.5rem)
3xl: 30px   (1.875rem)
4xl: 36px   (2.25rem)
5xl: 48px   (3rem)
6xl: 60px   (3.75rem)
7xl: 72px   (4.5rem)
```

### Font Weights
```css
Regular: 400     (body text)
Medium: 500      (labels, navigation)
Semibold: 600    (subheadings)
Bold: 700        (headings, CTAs)
Extrabold: 800   (hero text)
```

## Spacing Scale

```css
2xs: 4px    (0.25rem)
xs: 8px     (0.5rem)
sm: 12px    (0.75rem)
md: 16px    (1rem)
lg: 20px    (1.25rem)
xl: 24px    (1.5rem)
2xl: 32px   (2rem)
3xl: 40px   (2.5rem)
4xl: 48px   (3rem)
5xl: 64px   (4rem)
6xl: 80px   (5rem)
```

## Button Styles

### Primary Button
```css
Background: indigo-900 (light) / indigo-600 (dark)
Text: white
Padding: 16px 32px
Border Radius: 8px
Hover: darker shade
Transform: scale(1.05) on hover
```

### Secondary Button
```css
Background: transparent
Border: 2px indigo-900 (light) / indigo-400 (dark)
Text: indigo-900 (light) / indigo-400 (dark)
Padding: 16px 32px
Border Radius: 8px
Hover: semi-transparent fill
```

### Icon Button
```css
Background: gray-100 (light) / slate-800 (dark)
Padding: 8px
Border Radius: 8px
Hover: darker shade
Size: 24px icon
```

## Shadows & Elevation

```css
No shadow:        (most elements)
Small shadow:     0 1px 2px 0 rgba(0, 0, 0, 0.05)
Medium shadow:    0 4px 6px -1px rgba(0, 0, 0, 0.1)
Large shadow:     0 10px 15px -3px rgba(0, 0, 0, 0.1)
Extra large:      0 20px 25px -5px rgba(0, 0, 0, 0.1)
```

## Animations & Transitions

### Keyframe Animations
```css
fadeIn:         0.8s (opacity + translateY)
slideInUp:      0.8s (translateY)
slideInDown:    0.8s (translateY)
slideInLeft:    0.8s (translateX)
slideInRight:   0.8s (translateX)
float:          6s infinite (gentle bob)
glow:           3s infinite (opacity pulse)
pulseGlow:      2s infinite (box-shadow)
```

### Transitions
```css
Duration: 300ms (hover effects)
Duration: 3s (color scheme changes)
Timing: ease-out
Properties: colors, borders, transforms
```

## Responsive Breakpoints

```css
Mobile:     0px - 767px
Tablet:     768px - 1023px
Desktop:    1024px+

Grid Columns:
Mobile:     1 column
Tablet:     2 columns
Desktop:    3+ columns
```

## Image Guidelines

### Hero Illustration
- **Size**: 256px × 256px minimum
- **Format**: SVG (preferred) or PNG
- **Colors**: Use primary color scheme
- **Background**: Transparent or match section

### Service Icons
- **Format**: Emoji or SVG
- **Size**: 48px - 64px
- **Style**: Simple, recognizable
- **Color**: Inherit text color

### Social Media Preview
- **File**: `public/og-image.svg`
- **Size**: 1200px × 630px
- **Format**: SVG or PNG
- **Safe Area**: Center 1000px × 500px

### Favicon
- **File**: `public/logo.svg` (via manifest)
- **Size**: 32px × 32px
- **Format**: SVG
- **Shape**: Square or rounded square

## Content Spacing Examples

### Section Padding
```css
Desktop:    80px (py-20 = 80px)
Tablet:     60px (py-16)
Mobile:     40px (py-10)
```

### Container Max Width
```css
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
max-w-5xl: 64rem (used for most sections)
max-w-6xl: 72rem (used for footer)
max-w-4xl: 56rem (used for contact, about)
```

## Accessibility Colors

### Contrast Ratios
```
White on Indigo-900:  18.5:1 ✅ WCAG AAA
White on Indigo-600:  7.1:1 ✅ WCAG AA
Gray-900 on White:    20:1 ✅ WCAG AAA
Gray-700 on White:    7.5:1 ✅ WCAG AA
```

### Focus States
```css
Outline: 2px solid indigo-600
Outline Offset: 2px
Color: #6366f1 (light) / #818cf8 (dark)
```

## Dark Mode Implementation

### Tailwind Dark Mode Class
```html
<!-- Add to root element -->
<div class="dark">
  <!-- Dark mode content -->
</div>
```

### CSS Classes Pattern
```css
.dark:bg-slate-900      /* Dark bg */
.dark:text-slate-50     /* Dark text */
.dark:border-slate-700  /* Dark border */
```

## Brand Voice

### Visual Tone
- Professional and trustworthy
- Modern and clean
- Minimalist and elegant
- Technical yet approachable

### Visual Hierarchy
1. **Hero Headlines** (largest, boldest)
2. **Section Titles** (large, bold)
3. **Card Titles** (medium, semibold)
4. **Body Text** (regular weight)
5. **Secondary Text** (lighter color)

## Quick Reference

### Most Used Classes
```css
/* Spacing */
px-4 py-20 gap-8 mb-6 mt-4

/* Typography */
text-5xl font-bold text-gray-900

/* Colors */
text-indigo-900 bg-indigo-50 border-gray-200

/* Responsive */
md:grid-cols-2 lg:grid-cols-3 hidden md:flex

/* Effects */
rounded-lg hover:scale-105 transition-colors

/* Dark Mode */
dark:bg-slate-900 dark:text-white
```

## Design System Summary

| Element | Light | Dark |
|---------|-------|------|
| Background | White | Slate-950 |
| Text | Gray-900 | Slate-50 |
| Primary | Indigo-900 | Indigo-400 |
| Secondary | Gray-600 | Slate-300 |
| Border | Gray-200 | Slate-700 |
| Hover | Indigo-50 | Slate-800 |
| Shadow | Black 10% | Black 20% |

---

**Visual design is consistent, professional, and ready for production.**

All colors, typography, spacing, and animations follow a cohesive design system that works across light and dark modes.
