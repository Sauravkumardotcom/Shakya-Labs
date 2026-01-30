import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'localhost',
  },
  build: {
    copyPublicDir: true,
    assetsInclude: ['**/*.xml', '**/*.txt'],
  },
})
