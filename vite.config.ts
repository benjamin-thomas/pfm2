import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

if (!process.env.FE_PORT) throw new Error('Missing mandatory env var: FE_PORT');
if (!process.env.FE_HOST) throw new Error('Missing mandatory env var: FE_HOST');
if (!process.env.BE_BASE_URL) throw new Error('Missing mandatory env var: BE_BASE_URL');

const FE_PORT = parseInt(process.env.FE_PORT, 10);
const FE_HOST = process.env.FE_HOST;
const BE_BASE_URL = process.env.BE_BASE_URL;

export default defineConfig({
  plugins: [react()],
  root: 'src/client',
  server: {
    host: FE_HOST,
    port: FE_PORT,
    proxy: {
      '/api': {
        target: BE_BASE_URL,
        changeOrigin: true,
      },
      '/health': {
        target: BE_BASE_URL,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
  },
});
