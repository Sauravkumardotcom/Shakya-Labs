import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import sitemap from 'vite-plugin-sitemap'

export default defineConfig({
  plugins: [
    react(),
    sitemap({
      hostname: 'https://shakyalabs.com',
      routes: [
        // Main pages - explicitly defined
        {
          url: '/',
          changefreq: 'weekly',
          priority: 1.0,
          lastmod: new Date().toISOString(),
        },
        {
          url: '/birthday',
          changefreq: 'yearly',
          priority: 0.8,
          lastmod: new Date().toISOString(),
        },
      ],
      dynamicRoutes: [],
      outDir: 'dist',
      readable: true,
      // Generate gzip version for larger sitemaps
      compress: false,
    })
  ],
  server: {
    port: 5173,
    host: 'localhost',
  },
})
