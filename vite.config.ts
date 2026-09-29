import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    environmentMatchGlobs: [['src/__tests__/server/**', 'node']],
    setupFiles: ['./vitest.setup.ts'],
  },
});
