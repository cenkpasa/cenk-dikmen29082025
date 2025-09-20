import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // FIX: Replaced `__dirname` which is not available in Vite's ES Module context
      // with `process.cwd()` to correctly resolve the project's root directory.
      '@': path.resolve(process.cwd(), './'),
    },
  },
});