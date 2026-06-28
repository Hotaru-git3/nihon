// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000, 
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});