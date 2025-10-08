import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'src/client',
  server: {
    port: 5176,
    proxy: {
      '/api': {
        target: 'http://localhost:8086',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8086',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
  },
});
