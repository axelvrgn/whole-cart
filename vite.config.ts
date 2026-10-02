/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Forwards /off-search/* to the Open Food Facts search server. Their server doesn't
// accept calls from other websites (CORS), but a same-origin path relayed by our own
// server is fine. In production, vercel.json does the same job.
const offSearchProxy = {
  '/off-search': {
    target: 'https://search.openfoodfacts.org',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/off-search/, ''),
    // OFF asks apps to identify themselves; possible here, not from the browser.
    headers: { 'User-Agent': 'WholeCart/0.1 (axelvrgn.dev@gmail.com)' },
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Self-signed HTTPS certificate: Safari only gives camera access on HTTPS pages.
    // The iPhone will show a warning the first time; accept it once.
    // NO_HTTPS=1 serves plain HTTP instead (localhost counts as secure for browsers anyway).
    process.env.NO_HTTPS ? null : basicSsl(),
    // Generates the web manifest and a service worker (a script that runs in the
    // background and caches the app files, so the app opens even without network).
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Product photos are kept 30 days, so the chosen products still show in the shop without network.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://images.openfoodfacts.org',
            handler: 'CacheFirst',
            options: {
              cacheName: 'off-images',
              expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60 },
              // Images from another site come back "opaque" (status 0): accept them too.
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // API calls must never be answered with the app's index.html.
        navigateFallbackDenylist: [/^\/off-search/],
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Whole Cart',
        short_name: 'Whole Cart',
        description: 'Les produits les moins industriels pour chaque article de ta liste.',
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        theme_color: '#15803d',
        background_color: '#fafaf9',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: {
    host: true, // listen on the local network so the iPhone can reach it
    port: 5173,
    strictPort: true,
    // Inside Docker on Windows, file change events don't cross into the container: poll instead.
    watch: process.env.DOCKER ? { usePolling: true, interval: 300 } : undefined,
    proxy: offSearchProxy,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
    proxy: offSearchProxy,
  },
  test: {
    environment: 'node',
  },
})
