// ==========================================
// FICHIER: vite.config.js
// ==========================================
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies:   'injectManifest',
      srcDir:       'src',          // ✅ SW dans src/ pour être bundlé
      filename:     'sw.js',

      registerType: 'autoUpdate',

      includeAssets: [
        'logo_gazbf.png',
        'icons/*.png',
      ],

      manifest: {
        name:             'FasoGaz',
        short_name:       'FasoGaz',
        description:      'Plateforme de géolocalisation et commande de gaz au Burkina Faso',
        start_url:        '/',
        scope:            '/',
        display:          'standalone',
        background_color: '#000000',
        theme_color:      '#dc2626',
        orientation:      'portrait',
        lang:             'fr',
        categories:       ['shopping', 'utilities'],
        icons: [
          { src: '/icons/icon-72x72.png',   sizes: '72x72',   type: 'image/png' },
          { src: '/icons/icon-96x96.png',   sizes: '96x96',   type: 'image/png' },
          { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },

      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },

      devOptions: {
        enabled:          true,
        type:             'module',
        navigateFallback: 'index.html', // ✅ évite que Vite retourne du HTML pour /sw.js
      },
    }),
  ],

  server: { host: true },
})