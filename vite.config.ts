import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const makeServer = () => {
  // Skip server config during test runs
  if (process.env.VITEST) return;

  if (!process.env.FE_PORT) throw new Error('Missing mandatory env var: FE_PORT');
  if (!process.env.FE_HOST) throw new Error('Missing mandatory env var: FE_HOST');
  if (!process.env.BE_BASE_URL) throw new Error('Missing mandatory env var: BE_BASE_URL');

  const FE_PORT = parseInt(process.env.FE_PORT, 10);
  const FE_HOST = process.env.FE_HOST;
  const BE_BASE_URL = process.env.BE_BASE_URL;

  return {
    host: FE_HOST,
    port: FE_PORT,
    proxy: {
      '/api/': {
        target: BE_BASE_URL,
        changeOrigin: true,
      },
      '/health': {
        target: BE_BASE_URL,
        changeOrigin: true,
      },
    },
  };
};

export default defineConfig(({ command }) => ({
  plugins: [react()],
  root: 'src',
  server: command === 'serve' ? makeServer() : undefined,
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/client/index.html',
    },
  },
  test: {
    environment: 'happy-dom',
    typecheck: {
      enabled: true,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
    },
  },
}));
