/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Self-signed HTTPS certificate: Safari only gives camera access on HTTPS pages.
    // The iPhone will show a warning the first time; accept it once.
    basicSsl(),
    // Generates the web manifest and a service worker (a script that runs in the
    // background and caches the app files, so the app opens even without network).
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Clean Eating',
        short_name: 'Clean Eating',
        description: 'Des courses les moins transformées possible.',
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
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
  },
  test: {
    environment: 'node',
  },
})
