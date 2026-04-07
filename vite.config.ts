import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'French Conjugation Practice',
        short_name: 'French Verbs',
        description: 'Practice French verb conjugation offline with flashcards',
        start_url: './',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#6366f1',
        orientation: 'any',
        categories: ['education'],
        icons: [
          { src: './icons/manifest-icon-192.maskable.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: './icons/manifest-icon-192.maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: './icons/manifest-icon-512.maskable.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: './icons/manifest-icon-512.maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/words\.json$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'data-cache', expiration: { maxEntries: 5 } },
          },
          {
            urlPattern: /\/sentences\.json$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'data-cache', expiration: { maxEntries: 5 } },
          },
          {
            urlPattern: /\/audio\/.*\.mp3$/,
            handler: 'CacheFirst',
            options: { cacheName: 'audio-cache', expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /\/version\.json$/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './',
});
