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
          // Core React framework — always needed on every page
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Server-state management
          query: ['@tanstack/react-query'],
          // Firebase Auth — large but needed for auth flows
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          // Charts — admin dashboard only, never on customer pages
          charts: ['recharts'],
        }
      }
    }
  }
})
