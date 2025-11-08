import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/domains': {
        target: 'https://api.domains.co.za',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/domains/, '/api'),
        secure: false,
      }
    }
  }
})
