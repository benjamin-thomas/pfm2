import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const makeServer = () => {
  // Skip server config during test runs
  if (process.env.VITEST) return;

  // knip finds dead code
  if (process.env.npm_lifecycle_script === "knip") return; // npx knip
  if (process.env.npm_lifecycle_script?.startsWith("knip")) return; // npm run build:strict

  if (!process.env.FE_PORT) throw new Error('Missing mandatory env var: FE_PORT');
  if (!process.env.FE_HOST) throw new Error('Missing mandatory env var: FE_HOST');
  if (!process.env.BE_BASE_URL) throw new Error('Missing mandatory env var: BE_BASE_URL');

  const FE_PORT = parseInt(process.env.FE_PORT, 10);
  const FE_HOST = process.env.FE_HOST;
  const BE_BASE_URL = process.env.BE_BASE_URL;

  return {
    host: FE_HOST,
    port: FE_PORT,
    strictPort: true,
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
  root: 'src/client',
  server: command === 'serve' ? makeServer() : undefined,
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      // Fix elm-decoders package misconfiguration
      'elm-decoders': 'elm-decoders/dist/elm-decoders.esm.js',
    },
  },
  test: {
    root: 'src',
    environment: 'happy-dom',
    typecheck: {
      enabled: true,
    },
    coverage: {
      provider: 'v8',
      reporter: ['html', 'lcov'],
    },
  },
}));
