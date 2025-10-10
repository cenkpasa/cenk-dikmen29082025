
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // FIX: Replaced `__dirname` which can cause "not found" errors in certain module contexts
      // with `process.cwd()`, which reliably provides the project's root directory.
      '@': path.resolve(process.cwd(), './'),
    },
  },
});
