import react from '@vitejs/plugin-react';
import type { UserConfig } from 'vite';

/**
 * Shared Vite configuration between vite.config.ts and vitest.config.ts
 */
export const sharedConfig: UserConfig = {
  plugins: [react()],
  resolve: {
    alias: {
      // Fix elm-decoders package misconfiguration
      'elm-decoders': 'elm-decoders/dist/elm-decoders.esm.js',
    },
  },
};
