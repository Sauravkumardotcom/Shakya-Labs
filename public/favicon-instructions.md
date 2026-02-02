# Favicon Setup Instructions for Shakya Labs

## Overview
The HTML files have been configured to reference multiple favicon formats for maximum browser and device compatibility. Follow these steps to add your custom favicon:

## Favicon Files Needed

The following files should be placed in the `/public` directory:

1. **favicon.ico** - Traditional favicon (16x16, 32x32, or 48x48)
   - Single file supporting multiple sizes
   - Fallback for older browsers
   - Place in: `/public/favicon.ico`

2. **favicon-32x32.png** - Modern 32x32 PNG
   - Used by modern browsers in tabs and address bar
   - Place in: `/public/favicon-32x32.png`

3. **favicon-16x16.png** - Legacy 16x16 PNG
   - Used by older browsers
   - Place in: `/public/favicon-16x16.png`

4. **apple-touch-icon.png** - iOS Home Screen Icon (192x192)
   - Used when users add your site to their iOS home screen
   - Place in: `/public/apple-touch-icon.png`

## Current HTML Configuration

Both `index.html` and `brand-identity.html` include these favicon link tags:

```html
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="mask-icon" href="/logo.svg" color="#312e81" />
```

## How to Add Your Favicon

### Option 1: Convert Your Google Drive Image (Recommended)
1. Download the image from the Google Drive link:
   - Favicon: https://drive.google.com/file/d/1WZAaG7tx7l9rbNVYn0fOHlBP5C0B094W/view
2. Use an online converter tool like:
   - CloudConvert (https://cloudconvert.com/png-to-ico)
   - Favicon.io (https://favicon.io/favicon-converter/)
3. Convert to:
   - ICO format (favicon.ico)
   - PNG 32x32 (favicon-32x32.png)
   - PNG 16x16 (favicon-16x16.png)
   - PNG 192x192 for apple-touch-icon.png
4. Place files in `/public/`

### Option 2: Using Free Online Tools
1. Visit https://favicon.io/favicon-generator/
2. Upload or create your favicon
3. Generate all formats
4. Download and place in `/public/`

### Option 3: Using ImageMagick (Command Line)
```bash
# Convert PNG to ICO
convert logo.png -define icon:auto-resize=256,128,96,64,48,32,16 favicon.ico

# Create 32x32 PNG
convert logo.png -resize 32x32 favicon-32x32.png

# Create 16x16 PNG
convert logo.png -resize 16x16 favicon-16x16.png

# Create 192x192 for iOS
convert logo.png -resize 192x192 apple-touch-icon.png
```

## Brand Color Reference
- Primary Brand Color: **#312e81** (Indigo)
- Secondary Dark: **#030712** (Almost Black)

## Testing Your Favicon

After placing files in `/public/`:

1. **Hard refresh** your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Check browser tab - you should see your favicon
3. Check browser favorites - favicon should appear
4. Test on mobile devices (iOS adds to home screen)

## Validation Checklist

- [ ] favicon.ico exists in `/public/`
- [ ] favicon-32x32.png exists in `/public/`
- [ ] favicon-16x16.png exists in `/public/`
- [ ] apple-touch-icon.png exists in `/public/`
- [ ] Files are correct format (ICO and PNG)
- [ ] Favicon appears in browser tab after hard refresh
- [ ] No 404 errors in browser console for favicon files

## Additional Notes

- The mask-icon is set to use your existing `/logo.svg` with brand color
- All formats work together for comprehensive browser/device support
- Ensure favicon images are properly sized (no stretching)
- PNG files should be optimized for web (smaller file size)

## Production Deployment

When deploying to production:
1. Verify all favicon files are included in your build output
2. Ensure proper caching headers are set
3. Test across all major browsers
4. Validate with Favicon Checker: https://realfavicongenerator.net/favicon_checker

---

For more information on favicon best practices, see:
- https://web.dev/favicon/
- https://realfavicongenerator.net/
- https://developer.mozilla.org/en-US/docs/Glossary/Favicon
