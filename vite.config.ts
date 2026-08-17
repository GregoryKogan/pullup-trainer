import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { APP_NAME, APP_SHORT_NAME } from './src/constants/app-brand'

export default defineConfig({
  base: '/pullup-trainer/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-32.png', 'icon-180.png', 'sounds/set-start-go.wav'],
      manifest: {
        id: '/pullup-trainer/',
        name: APP_NAME,
        short_name: APP_SHORT_NAME,
        description: 'Local-first pull-up training PWA',
        theme_color: '#C6FF3B',
        background_color: '#0E0E0B',
        display: 'standalone',
        scope: '/pullup-trainer/',
        start_url: '/pullup-trainer/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/pullup-trainer/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,wav}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
