import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: {
      // Disable COOP in dev so Firebase Auth popup can communicate with the page
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React framework — always needed
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Server-state management
          query: ['@tanstack/react-query'],
          // Firebase Auth — loaded on demand but grouped together
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          // Animations — only used in product pages and hero section
          motion: ['framer-motion'],
          // Charts — only used in admin dashboard
          charts: ['recharts'],
        }
      }
    }
  }
})
