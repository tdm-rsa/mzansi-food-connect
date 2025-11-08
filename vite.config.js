import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/domains/proxy': {
        target: 'https://api.domains.co.za',
        changeOrigin: true,
        rewrite: (path) => {
          // Extract path parameter from query string
          const url = new URL(path, 'http://localhost');
          const apiPath = url.searchParams.get('path');
          url.searchParams.delete('path');
          const queryString = url.searchParams.toString();
          return `/api/${apiPath}${queryString ? `?${queryString}` : ''}`;
        },
        secure: false,
      }
    }
  }
})
